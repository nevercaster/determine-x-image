// ==UserScript==
// @name         Determine X Image
// @namespace    atk-def
// @version      1.2.1
// @description  Retrieve the original image dimensions and download request in X (Twitter).
// @author       Minakami
// @match        https://x.com/*
// @match        https://twitter.com/*
// @match        https://tweetdeck.twitter.com/*
// @grant        none
// @license      MIT
// @icon         https://www.gstatic.com/android/keyboard/emojikitchen/20230127/u1f307/u1f307_u1f4f0.png?fbx
// ==/UserScript==

/* jshint esversion: 11 */

const globalStyles = `
  .dxi-toolbar {
    display: none;
    position: absolute;
    margin: 1rem;
    top: 0;
    left: 0;
    gap: 0.5rem;
    align-items: center;
  }
  .dxi-toolbar > * {
    background-color: rgba(0, 0, 0, 0.4);
    color: white;
    backdrop-filter: blur(1rem);
    border-radius: 5rem;
  }
  .dxi-toolbar > span {
    text-align: center;
    font-size: 0.75rem;
    font-weight: bold;
    padding: 0.5rem 0.75rem;
    pointer-events: none;
  }
  .dxi-toolbar > button {
    width: 2rem;
    height: 2rem;
    border: 0;
    outline: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .dxi-toolbar > button:hover {
    filter: brightness(0.9);
  }
`;

/**
 * @param {string} sourceURL
 * @returns {string}
 */
const getFileExtensionByURL = (sourceURL) => {
  const lastSlashIndex = sourceURL.lastIndexOf("/");
  const filename = sourceURL.substring(lastSlashIndex + 1);
  const lastDotIndex = filename.lastIndexOf(".");
  const fileExtension = filename.substring(lastDotIndex + 1);
  return fileExtension;
};

/**
 * @param {string} sourceURL
 * @param {(image: Image) => void} callback
 * @returns {Promise<string>}
 */
const getOriginalImageURLByURL = async (sourceURL, callback) => {
  const queryName = "name";
  const newImageQualityValue = "orig";
  const regex = new RegExp(`([?&])${queryName}=([^&]*)`, "i");
  const originalImageURL = sourceURL.replace(
    regex,
    `$1${queryName}=${newImageQualityValue}`
  );
  const originalImage = new Image();
  originalImage.src = originalImageURL;
  return await new Promise((resolve) => {
    originalImage.onload = function () {
      callback(this);
      resolve(originalImageURL);
    };
  });
};

/**
 * @param {string} sourceURL
 * @returns {string}
 */
const getFileNameByURL = (sourceURL) => {
  const url = new URL(sourceURL);
  const pathname = url.pathname;
  const parts = pathname.split("/");
  const fileName = parts.at(-1);
  return fileName;
};

/**
 * @param {string} sourceURL
 * @returns {void}
 */
const downloadImage = async (sourceURL) => {
  const image = await fetch(sourceURL);
  const imageBlob = await image.blob();
  const imageURL = URL.createObjectURL(imageBlob);
  const link = document.createElement("a");
  link.href = imageURL;
  link.download = getFileNameByURL(imageURL);
  link.click();
};

(() => {
  "use strict";

  const styleSheet = document.createElement("style");
  styleSheet.innerHTML = globalStyles;
  document.head.appendChild(styleSheet);

  const imageDimensions = document.createElement("span");
  const downloadBtn = document.createElement("button");
  const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M11 4h2v8h2v2h-2v2h-2v-2H9v-2h2V4zm-2 8H7v-2h2v2zm6 0v-2h2v2h-2zM4 18h16v2H4v-2z"/></svg>`;
  downloadBtn.innerHTML = downloadIcon;

  const toolbar = document.createElement("div");
  toolbar.classList.add("dxi-toolbar");
  toolbar.appendChild(imageDimensions);
  toolbar.appendChild(downloadBtn);

  document.body.addEventListener("mouseover", async (event) => {
    const image = event.target;
    if (image.tagName === "IMG") {
      const imageURL = image.src;

      if (getFileExtensionByURL(imageURL) === "svg") {
        return;
      }

      image.parentNode.appendChild(toolbar);

      const originalImageURL = await getOriginalImageURLByURL(
        imageURL,
        (originalImage) => {
          const { naturalWidth, naturalHeight } = originalImage;
          imageDimensions.textContent = `${naturalWidth} × ${naturalHeight}`;
        }
      );

      downloadBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        downloadImage(originalImageURL);
      };

      toolbar.style.display = "flex";
    }
  });

  document.body.addEventListener("mouseout", (event) => {
    if (
      event.target.tagName === "IMG" &&
      event.relatedTarget !== toolbar &&
      !toolbar.contains(event.relatedTarget)
    ) {
      toolbar.style.display = "none";
    }
  });
})();
