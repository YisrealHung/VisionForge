/**
 * Shared webcam helpers.
 *
 * Why serialize: on Windows many webcams can only be opened once at a time. React StrictMode
 * (dev) mounts effects twice and device switches restart the stream, so two getUserMedia calls
 * can overlap; the second then fails with NotReadableError ("Could not start video source").
 * Every open goes through one queue, so a request only starts after the previous one finished
 * (and its caller had the chance to stop a stale stream).
 */

export type CameraErrorKind = 'insecure' | 'denied' | 'notfound' | 'busy' | 'constraint' | 'unknown';

export class CameraError extends Error {
  kind: CameraErrorKind;
  constructor(kind: CameraErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

let queue: Promise<unknown> = Promise.resolve();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function classify(err: unknown): CameraErrorKind {
  const name = (err as { name?: string })?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'notfound';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') return 'constraint';
  return 'unknown';
}

async function attempt(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('insecure', 'Camera requires a secure context (https or localhost)');
  }
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    const kind = classify(err);
    if (kind === 'busy') {
      // The previous stream may still be releasing the device (Windows takes a moment).
      await sleep(500);
      return await navigator.mediaDevices.getUserMedia(constraints);
    }
    if (kind === 'constraint' && typeof constraints.video === 'object') {
      // Saved deviceId no longer exists or resolution not supported: fall back to any camera.
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    throw err;
  }
}

/** Open a camera stream; calls are queued so two opens never overlap. */
export function openCameraStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
  const run = queue.then(() => attempt(constraints));
  queue = run.catch(() => undefined);
  return run;
}

export function stopStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((t) => t.stop());
}

export function videoConstraints(deviceId: string | undefined, width: number, height: number): MediaStreamConstraints {
  return {
    video: deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: width }, height: { ideal: height } }
      : { width: { ideal: width }, height: { ideal: height } },
    audio: false,
  };
}

/** A user-facing explanation of why the camera could not be opened. */
export function describeCameraError(err: unknown, isZh: boolean): string {
  const kind = err instanceof CameraError ? err.kind : classify(err);
  switch (kind) {
    case 'insecure': {
      const port = window.location.port ? `:${window.location.port}` : '';
      return isZh
        ? `瀏覽器只允許在 https 或 localhost 使用攝影機。請改用 http://localhost${port} 開啟本頁（目前為 ${window.location.host}）。`
        : `Browsers only allow the camera on https or localhost. Open this page as http://localhost${port} (currently ${window.location.host}).`;
    }
    case 'denied':
      return isZh
        ? '攝影機權限被拒絕。請點網址列左側的相機圖示允許存取，然後重新整理頁面。'
        : 'Camera permission was denied. Allow it from the camera icon in the address bar, then reload.';
    case 'notfound':
      return isZh ? '找不到攝影機，請確認已連接並被系統辨識。' : 'No camera found. Check that one is connected.';
    case 'busy':
      return isZh
        ? '攝影機正被其他程式或分頁使用（例如視訊會議、相機 App、另一個 VisionForge 分頁），請關閉後再試。'
        : 'The camera is in use by another app or tab (video call, camera app, another VisionForge tab). Close it and retry.';
    default:
      return isZh ? '無法開啟攝影機，請檢查裝置後重試。' : 'Could not open the camera. Check the device and retry.';
  }
}
