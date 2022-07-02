import fs from "../modules/filesystem";

let captureStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;

export function stopCapture() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

export async function startCapture() {
  const displayMediaOptions = {
    video: { width: 1920, height: 1080, frameRate: 60 },
  };

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );
  } catch (err) {
    console.error("Error: " + err);
  }

  const video = document.createElement("video");
  video.oncanplay = () => {
    video.play();
  };
  video.srcObject = captureStream;

  const chunks: Blob[] = [];

  if (captureStream) {
    mediaRecorder = new MediaRecorder(captureStream, {
      mimeType: "video/webm",
    });

    mediaRecorder.start();

    mediaRecorder.onstop = async () => {
      video.remove();

      const blob = new Blob(chunks);
      const buffer = await blob.arrayBuffer();
      const hash = await fs.saveBuffer(buffer);
      console.log("buffer hash:", hash);

      // stop the display capture
      const tracks = captureStream?.getVideoTracks() || [];
      for (let track of tracks) {
        track.stop();
      }

      fs.list().then(async (list) => {
        console.log(list);

        for (let [name, file] of list) {
          if (name === hash) {
            const f = await file.getFile();

            console.log(f);

            const buff = await f.arrayBuffer();

            console.log(buff);

            const blob = new Blob([buff], { type: "video/webm" });

            console.log(blob);

            const video = document.createElement("video");
            video.src = URL.createObjectURL(blob);
            video.oncanplay = video.play;

            document.body.append(video);
          }
        }
      });
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  }

  document.body.append(video);

  return captureStream;
}
