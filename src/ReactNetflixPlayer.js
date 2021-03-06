import React, { useEffect, useState, useRef } from 'react';
import {
  FaUndoAlt,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeOff,
  FaVolumeMute,
  FaArrowLeft,
  FaExpand,
  FaStepForward,
  FaCog,
  FaClone,
  FaCompress,
  FaRedoAlt,
} from 'react-icons/fa';
import { FiCheck, FiX } from 'react-icons/fi';
import './styles.scss';

export default function ReactNetflixPlayer({
  title = false,
  subTitle = false,
  titleMedia = false,
  extraInfoMedia = false,

  fullPlayer = true,
  backButton = false,

  src,
  autoPlay = false,

  onCanPlay = false,
  onTimeUpdate = false,
  onEnded = false,
  onErrorVideo = false,
  onNextClick = false,
  onClickItemListReproduction = false,
  onCrossClick = () => {},
  startPosition = 0,

  dataNext = {},
  reprodutionList = [],
  qualities = [],
  onChangeQuality = [],
  playbackRateEnable = true,
}) {
  // Referências
  const videoComponent = useRef(null);
  const timerRef = useRef(null);
  const timerBuffer = useRef(null);
  const playerElement = useRef(null);
  const listReproduction = useRef(null);

  // Estados
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [end, setEnd] = useState(false);
  const [controllBackEnd, setControllBackEnd] = useState(false);
  const [fullSreen, setFullSreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [mutted, setMutted] = useState(false);
  const [error, setError] = useState(false);
  const [waitingBuffer, setWaitingBuffer] = useState(false);
  const [showControlls, setShowControlls] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [showControllVolume, setShowControllVolume] = useState(false);
  const [showQuallity, setShowQuallity] = useState(false);
  const [showDataNext, setShowDataNext] = useState(false);
  const [showPlaybackRate, setShowPlaybackRate] = useState(false);
  const [showReproductionList, setShowReproductionList] = useState(false);

  const playbackRateOptions = ['0.25', '0.5', '0.75', 'Normal', '1.25', '1.5', '2'];

  const [atualBuffer, setAtualBuffer] = useState({
    index: 0,
    start: 0,
    end: 0,
  });

  const secondsToHms = (d) => {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    let s = Math.floor((d % 3600) % 60);

    if (s < 10) {
      s = `0${s}`;
    }

    if (h) {
      return `${h}:${m}:${s}`;
    }

    return `${m}:${s}`;
  };

  const timeUpdate = (e) => {
    setShowInfo(false);
    setEnd(false);
    if (playing) {
      setPlaying(true);
    }

    if (waitingBuffer) {
      setWaitingBuffer(false);
    }

    if (timerBuffer.current) {
      clearTimeout(timerBuffer.current);
    }

    timerBuffer.current = setTimeout(() => setWaitingBuffer(true), 1000);

    if (onTimeUpdate) {
      onTimeUpdate(e);
    }

    let choseBuffer = 0;
    const lenghtBuffer = e.target.buffered.length;
    let start = 0;
    let endBuffer = 0;
    const atualTime = e.target.currentTime;

    for (let i = 1; i <= lenghtBuffer; i++) {
      const startCheck = e.target.buffered.start(i - 1);
      const endCheck = e.target.buffered.end(i - 1);

      if (endCheck > atualTime && atualTime > startCheck) {
        choseBuffer = i;

        if (endCheck > endBuffer) {
          endBuffer = endCheck;
        }

        if (startCheck < start) {
          start = startCheck;
        }
      }
    }

    setAtualBuffer({
      index: choseBuffer,
      start,
      endBuffer,
    });

    setProgress(e.target.currentTime);
  };

  const goToPosition = (position) => {
    videoComponent.current.currentTime = position;
    setProgress(position);
  };

  const alteraStatusVideo = () => {
    setDuration(videoComponent.current.duration);
  };

  const play = () => {
    setPlaying(!playing);

    if (videoComponent.current.paused) {
      videoComponent.current.play();
      return;
    }

    videoComponent.current.pause();
  };

  const onEndedFunction = () => {
    if (
      +startPosition === +videoComponent.current.duration
      && !controllBackEnd
    ) {
      setControllBackEnd(true);
      videoComponent.current.currentTime = videoComponent.current.duration - 30;
      if (autoPlay) {
        setPlaying(true);
        videoComponent.current.play();
      } else {
        setPlaying(false);
      }
    } else {
      setEnd(true);
      setPlaying(false);

      if (onEnded) {
        onEnded();
      }
    }
  };

  const nextSeconds = (seconds) => {
    const current = videoComponent.current.currentTime;
    const total = videoComponent.current.duration;

    if (current + seconds >= total - 2) {
      videoComponent.current.currentTime = videoComponent.current.duration - 1;
      setProgress(videoComponent.current.duration - 1);
      return;
    }

    videoComponent.current.currentTime += seconds;
    setProgress(videoComponent.current.currentTime + seconds);
  };

  const previousSeconds = (seconds) => {
    const current = videoComponent.current.currentTime;

    if (current - seconds <= 0) {
      videoComponent.current.currentTime = 0;
      setProgress(0);
      return;
    }

    videoComponent.current.currentTime -= seconds;
    setProgress(videoComponent.current.currentTime - seconds);
  };

  const liberarVideo = () => {
    alteraStatusVideo();
    setVideoReady(true);
    onCanPlay();
  };

  const erroVideo = () => {
    if (onErrorVideo) {
      onErrorVideo();
    }
    setError('Ocorreu um erro ao tentar reproduzir este vídeo -_-');
  };

  const setMuttedAction = (value) => {
    setMutted(value);
    setShowControllVolume(false);
    videoComponent.current.muted = value;
  };

  const setVolumeAction = (value) => {
    setVolume(value);
    videoComponent.current.volume = value / 100;
  };

  const exitFullScreen = () => {
    if (
      document.webkitIsFullScreen
      || document.mozFullScreen
      || document.msFullscreenElement
      || document.fullscreenElement
    ) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else {
        document.webkitExitFullscreen();
      }

      setFullSreen(false);
    }
  };

  const enterFullScreen = () => {
    setShowInfo(true);
    if (playerElement.current.requestFullscreen) {
      playerElement.current.requestFullscreen();
      setFullSreen(true);
    } else if (playerElement.current.webkitRequestFullscreen) {
      playerElement.current.webkitRequestFullscreen();
      setFullSreen(true);
    }
  };

  const chooseFullScreen = () => {
    if (
      document.webkitIsFullScreen
      || document.mozFullScreen
      || document.msFullscreenElement
      || document.fullscreenElement
    ) {
      document.exitFullscreen();
      return;
    }

    setShowInfo(true);

    if (playerElement.current.requestFullscreen) {
      playerElement.current.requestFullscreen();
    } else if (playerElement.current.webkitRequestFullscreen) {
      playerElement.current.webkitRequestFullscreen();
    } else if (playerElement.current.mozRequestFullScreen) {
      playerElement.current.mozRequestFullScreen();
    } else if (playerElement.current.msRequestFullscreen) {
      playerElement.current.msRequestFullscreen();
    }

    setFullSreen(true);
  };

  const setStateFullScreen = () => {
    if (
      !document.webkitIsFullScreen
      && !document.mozFullScreen
      && !document.msFullscreenElement
      && !document.fullscreenElement
    ) {
      setFullSreen(false);
      return;
    }

    setFullSreen(true);
  };

  const controllScreenTimeOut = () => {
    setShowControlls(false);
    if (!playing) {
      setShowInfo(true);
    }
  };

  const hoverScreen = () => {
    setShowControlls(true);
    setShowInfo(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(controllScreenTimeOut, 5000);
  };

  const getKeyBoardInteration = (e) => {
    if (e.keyCode === 32 && videoComponent.current) {
      if (videoComponent.current.paused) {
        videoComponent.current.play();
        setPlaying(true);
        hoverScreen();
      } else {
        videoComponent.current.pause();
        setPlaying(false);
        hoverScreen();
      }
    }
  };

  const scrollToSelected = () => {
    const element = listReproduction.current;
    const selected = element.getElementsByClassName('selected')[0];
    const position = selected.offsetTop;
    const height = selected.offsetHeight;
    element.scrollTop = position - height * 2;
  };

  const onChangePlayBackRate = (speed) => {
    speed = speed === 'Normal' ? 1 : speed;
    videoComponent.current.playbackRate = speed;
    setPlaybackRate(speed);
  };

  useEffect(() => {
    if (showReproductionList) {
      scrollToSelected();
    }
  }, [showReproductionList]);

  useEffect(() => {
    if (src) {
      videoComponent.current.currentTime = startPosition;
      setProgress(0);
      setDuration(0);
      setVideoReady(false);
      setError(false);
      setShowReproductionList(false);
      setShowDataNext(false);
      setAtualBuffer({
        index: 0,
        start: 0,
        end: 0,
      });
      setPlaying(autoPlay);
    }
  }, [src]);

  useEffect(() => {
    document.addEventListener('keydown', getKeyBoardInteration, false);
    playerElement.current.addEventListener(
      'fullscreenchange',
      setStateFullScreen,
      false,
    );
  }, []);

  // When changes happend in fullscreen document, teh state of fullscreen is changed
  useEffect(() => {
    setStateFullScreen();
  }, [document.fullscreenElement, document.webkitIsFullScreen, document.mozFullScreen, document.msFullscreenElement]);

  function renderLoading() {
    return (
      <div className="loading">
        <div className="loading-component">
          <div />
          <div />
          <div />
        </div>
      </div>
    );
  }

  function renderInfoVideo() {
    return (
      <div
        className={`sobre-video ${
          showInfo === true && videoReady === true && playing === false
            ? 'opacity-100'
            : 'opacity-0'
        }`}
      >
        {(title || subTitle) && (
          <div className="center">
            <div className="text">Você está assistindo</div>
            <div className="title">{title}</div>
            <div className="sub-title">{subTitle}</div>
          </div>
        )}
        <div className="botton">Pausado</div>
      </div>
    );
  }

  function renderCloseVideo() {
    return (
      <div
        className={`sobre-video-loading ${
          videoReady === false || (videoReady === true && error)
            ? 'opacity-100'
            : 'opacity-0 z-index-0'
        }`}
      >
        {(title || subTitle) && (
          <div className="header-loading">
            <div>
              <div className="title">{title}</div>
              <div className="sub-title">{subTitle}</div>
            </div>
            <FiX onClick={onCrossClick} />
          </div>
        )}

        <div className={`error ${error ? 'opacity-100' : 'opacity-0'}`}>
          {error && (
            <div>
              <h1>{error}</h1>
              {qualities.length > 1 && (
                <div>
                  <p>Tente acessar por outra qualidade</p>
                  <div className="links-error">
                    {qualities.map((item) => (
                      <div onClick={() => onChangeQuality(item.id)}>
                        {item.prefix && <span>HD</span>}

                        <span>{item.nome}</span>
                        {item.playing && <FiX />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        id="player-component"
        onMouseMove={hoverScreen}
        ref={playerElement}
        className={fullPlayer ? 'player-component full' : 'player-component'}
        onDoubleClick={chooseFullScreen}
      >
        {(videoReady === false
          || (waitingBuffer === true && playing === true))
          && !error
          && !end
          && renderLoading()}

        {renderInfoVideo()}

        {renderCloseVideo()}

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          className={`${!error ? 'opacity-100' : 'opacity-0'}`}
          id="player-video"
          ref={videoComponent}
          src={src}
          controls={false}
          autoPlay={autoPlay}
          onCanPlay={() => liberarVideo()}
          onTimeUpdate={timeUpdate}
          onError={erroVideo}
          onEnded={onEndedFunction}
        />

        <div
          className={`player-controlls ${
            showControlls === true && videoReady === true && error === false
              ? 'opacity-100 scale-0'
              : 'opacity-0 scale-1'
          }`}
        >
          {backButton && (

            <div className="back">
              <div onClick={backButton} style={{ cursor: 'pointer' }}>
                <FaArrowLeft />
                <span>Voltar à navegação</span>
              </div>
            </div>
          )}

          {showControllVolume !== true
            && showQuallity !== true
            && !showDataNext
            && !showReproductionList && (
              <div className="line-reproduction">
                <input
                  type="range"
                  value={progress}
                  className="progress-bar"
                  max={duration}
                  onChange={(e) => goToPosition(e.target.value)}
                  title=""
                  style={{
                    background: `linear-gradient(93deg, rgba(247,139,40,1) ${
                      (progress * 100) / duration
                    }%, rgba(210,210,210,1) ${
                      (progress * 100) / duration
                    }%,  rgba(150,150,150,1) ${
                      (atualBuffer.end * 100) / duration
                    }%, rgba(200,200,200,1) ${
                      (atualBuffer.end * 100) / duration
                    }%)`,
                  }}
                />
                <span>{secondsToHms(duration - progress)}</span>
              </div>
          )}

          {videoReady === true && (
            <div className="controlls">
              <div className="start">
                <div className="item-control">
                  {!playing && <FaPlay onClick={play} />}
                  {playing && <FaPause onClick={play} />}
                </div>

                <div className="item-control">
                  <FaUndoAlt onClick={() => previousSeconds(5)} />
                </div>

                <div className="item-control">
                  <FaRedoAlt onClick={() => nextSeconds(5)} />
                </div>

                {mutted === false && (
                  <div
                    onMouseLeave={() => setShowControllVolume(false)}
                    className="item-control volumn-component"
                  >
                    {showControllVolume === true && (
                      <div className="volumn-controll">
                        <div className="box-connector" />
                        <div className="box">
                          <input
                            style={{
                              background: `linear-gradient(93deg, rgba(247,139,40,1) ${volume}%, rgba(210,210,210,1) ${volume}%)`,
                            }}
                            type="range"
                            min={0}
                            max={100}
                            value={volume}
                            onChange={(e) => setVolumeAction(e.target.value)}
                            title=""
                          />
                        </div>
                      </div>
                    )}

                    {volume >= 60 && (
                      <FaVolumeUp
                        onMouseEnter={() => setShowControllVolume(true)}
                        onClick={() => setMuttedAction(true)}
                      />
                    )}

                    {volume < 60 && volume >= 10 && (
                      <FaVolumeDown
                        onMouseEnter={() => setShowControllVolume(true)}
                        onClick={() => setMuttedAction(true)}
                      />
                    )}

                    {volume < 10 && volume > 0 && (
                      <FaVolumeOff
                        onMouseEnter={() => setShowControllVolume(true)}
                        onClick={() => setMuttedAction(true)}
                      />
                    )}

                    {volume <= 0 && (
                      <FaVolumeMute
                        onMouseEnter={() => setShowControllVolume(true)}
                        onClick={() => setVolumeAction(0)}
                      />
                    )}
                  </div>
                )}

                {mutted === true && (
                  <div className="item-control">
                    <FaVolumeMute onClick={() => setMuttedAction(false)} />
                  </div>
                )}

                <div className="item-control info-video">
                  <span className="info-first">{titleMedia}</span>
                  <span className="info-secund">{extraInfoMedia}</span>
                </div>
              </div>

              <div className="end">
                {!!playbackRateEnable && (
                <div
                  className="item-control"
                  onMouseLeave={() => setShowPlaybackRate(false)}
                >
                  {showPlaybackRate === true && (
                  <div className="item-component playbackRate">
                    <div className="content-next">
                      <div className="title">Velocidades</div>
                      {playbackRateOptions.map((item) => (
                        <div className="item" onClick={() => onChangePlayBackRate(item)}>
                          {((+item === +playbackRate) || (item === 'Normal' && +playbackRate === 1)) && FiCheck()}
                          <div className="bold">
                            {item === 'Normal' ? item : `${item}x`}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="box-connector" />
                  </div>
                  )}

                  <div className="playbackRate" onMouseEnter={() => setShowPlaybackRate(true)}>
                    <span>
                      {playbackRate === 'Normal' ? '1' : `${playbackRate}`}<small>x</small>
                    </span>
                  </div>
                </div>
                )}

                {onNextClick && (
                  <div
                    className="item-control"
                    onMouseLeave={() => setShowDataNext(false)}
                  >
                    {showDataNext === true && dataNext.title && (
                      <div className="item-component">
                        <div className="content-next">
                          <div className="title">Próximo Episódio</div>
                          <div className="item" onClick={onNextClick}>
                            <div className="bold">{dataNext.title}</div>
                            {dataNext.description && (
                              <div>{dataNext.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="box-connector" />
                      </div>
                    )}

                    <FaStepForward
                      onClick={onNextClick}
                      onMouseEnter={() => setShowDataNext(true)}
                    />
                  </div>
                )}

                <div
                  className="item-control"
                  onMouseLeave={() => setShowReproductionList(false)}
                >
                  {showReproductionList && (
                    <div className="item-component item-component-list-rep">
                      <div className="content-list-reprodution">
                        <div className="title">Lista de Reprodução</div>
                        <div
                          ref={listReproduction}
                          className="list-list-reproduction scroll-clean-player"
                        >
                          {reprodutionList.map((item, index) => (
                            <div
                              className={`item-list-reproduction ${
                                item.playing && 'selected'
                              }`}
                              onClick={() => onClickItemListReproduction
                                && onClickItemListReproduction(
                                  item.id,
                                  item.playing,
                                )}
                            >
                              <div className="bold">
                                <span style={{ marginRight: 15 }}>
                                  {index + 1}
                                </span>
                                {item.nome}
                              </div>

                              {item.percent && <div className="percent" />}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="box-connector" />
                    </div>
                  )}
                  {reprodutionList && reprodutionList.length > 1 && (
                    <FaClone
                      onMouseEnter={() => setShowReproductionList(true)}
                    />
                  )}
                </div>

                {qualities && qualities.length > 1 && (
                  <div
                    className="item-control"
                    onMouseLeave={() => setShowQuallity(false)}
                  >
                    {showQuallity === true && (
                      <div className="list-quality-component">
                        <div className="content">
                          {qualities
                            && qualities.map((item) => (
                              <div
                                onClick={() => {
                                  setShowQuallity(false);
                                  onChangeQuality(item.id);
                                }}
                              >
                                {item.prefix && <span>HD</span>}

                                <span>{item.nome}</span>
                                {item.playing && <FiCheck />}
                              </div>
                            ))}
                        </div>
                        <div className="box-connector" />
                      </div>
                    )}

                    <FaCog onMouseEnter={() => setShowQuallity(true)} />
                  </div>
                )}

                <div className="item-control">
                  {fullSreen === false && (
                    <FaExpand onClick={enterFullScreen} />
                  )}
                  {fullSreen === true && (
                    <FaCompress onClick={exitFullScreen} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
