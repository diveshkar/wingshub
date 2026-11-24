"use client";

import Image from "next/image";
import type { SyntheticEvent } from "react";
import { BITE_STYLE } from "./bite-mask";
import { STORY_PHOTOS } from "./story-photos";
import { useIdleReady } from "./use-idle-ready";

const SIZES = "(min-width: 1024px) 440px, 82vw";

type Photo = (typeof STORY_PHOTOS)[number];

/** The pictures fade in once they have loaded, so a slow connection never shows a blank. */
const markLoaded = (event: SyntheticEvent<HTMLImageElement>) =>
  event.currentTarget.setAttribute("data-loaded", "");

function ScenePhoto({ photo }: { photo: Photo }) {
  return (
    <Image
      src={photo.src}
      alt=""
      fill
      sizes={SIZES}
      loading="eager"
      fetchPriority="low"
      onLoad={markLoaded}
    />
  );
}

/**
 * The four kitchen photos that take over the round window as the visitor scrolls. They are added once
 * the page has finished loading and the browser is idle, so they never compete with the first view,
 * and not at all for visitors who asked for less motion or to save data (they get plain photos in the
 * captions instead).
 */
export function StoryScenes() {
  const ready = useIdleReady();
  if (!ready) return null;

  const [dusting, cooking, tossing, biting] = STORY_PHOTOS;

  // Order matters: each scene sits on top of the one before it. data-scope tells the scroll
  // controller which element gets which numbers (see story-controller.tsx).
  return (
    <>
      <div className="scene scene-dust" data-scope="dust">
        <ScenePhoto photo={dusting} />
      </div>
      <div className="scene scene-cook" data-scope="cook">
        <ScenePhoto photo={cooking} />
      </div>
      <div className="scene scene-bite" data-scope="bite">
        <ScenePhoto photo={biting} />
      </div>
      <div className="scene scene-toss" data-scope="toss">
        <div className="scene-eaten" style={BITE_STYLE}>
          <ScenePhoto photo={tossing} />
        </div>
      </div>
    </>
  );
}
