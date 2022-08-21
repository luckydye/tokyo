import { State } from "@luckydye/app-state";
import FFmpeg from "./modules/greet";
// import "./modules/ffmpeg/ffmpeg";
import { log } from "./log";
import fs from "./modules/filesystem";

const modules = import.meta.glob("./components/*");

for (const path in modules) {
  // load all components async
  modules[path]();
}

declare global {
  const __APP_VERSION__: string;
  const __IS_DEBUG__: boolean;
}

async function main() {
  console.log(
    "%cWeb Image Creator - Version: " + __APP_VERSION__,
    "color:red;font-weight:bold;"
  );

  log("Web Image Creator");
  log(`Version ${__APP_VERSION__}`);

  log("Test ffmpeg module");
  FFmpeg.test();

  const items = (await fs.list()).map((item) => item[1].name);
  State.scope("media", { items: JSON.stringify(items, null, "\t") });

  fs.get("cap.mp%01d").then(async (file) => {
    const f = await file?.getFile();
    if (f) {
      const uri = URL.createObjectURL(f);

      const video = document.createElement("video");
      video.src = uri;
      video.controls = true;
      video.loop = true;

      document.body.append(video);
    }
  });

  // fs.get("output.webp").then(async (file) => {
  //   const f = await file?.getFile();
  //   const uri = URL.createObjectURL(f);

  //   const img = new Image();
  //   img.src = uri;

  //   document.body.append(img);
  // });

  // log("Load example EXR file");
  // const exrFile = await (await fetch("./powder.exr")).arrayBuffer();

  // log("decode exr file");
  // await EXR.load(new Uint8Array(exrFile))
  //   .then(() => {
  //     log("done");
  //   })
  //   .catch((err) => {
  //     console.error(err);
  //     log("decode failed");
  // });
}

window.addEventListener("DOMContentLoaded", main);
