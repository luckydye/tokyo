import { Accessor } from "tokyo-accessors";
import { DynamicImage } from "../DynamicImage.js";
import Worker from "../Worker.js";
import { MessageType } from "../lib.js";
import { HostLibrary } from "../api/HostLibrary.js";

export function createThumbnailAccessor(hosts: string[]) {
  const makeThumbnail = (blob?: Blob) => {
    const dynimg = new DynamicImage();
    const canvas = dynimg.canvas();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        dynimg.fromDrawable(image, {}).resizeContain(256);
        const newCanvas = dynimg.canvas();
        canvas.parentNode?.replaceChild(newCanvas, canvas);
      };
      image.onerror = (err) => {
        console.warn("Error loading thumbnail image", err);
      };
      image.src = url;
    }
    return canvas;
  };

  return new Accessor([new HostLibrary()], {
    createRequest(query: {
      ids: string[];
    }) {
      return [
        {
          type: MessageType.Thumbnails,
          ids: query.ids,
        },
      ];
    },

    transform(msg) {
      if (msg.type === MessageType.Locations) {
        const thumbs = msg.data.map((d) => {
          const buff = new Uint8Array(d.data.thumbnail);
          const blob = new Blob([buff]);
          return { thumbnail: makeThumbnail(blob), id: d.data.id };
        });
        return thumbs;
      }
    },

    compute: ([data]) => data,
  });
}
