// Image loading utility with error handling and loading states
export class ImageLoader {
  static defaultImage = "images/placeholder-book.svg"; // fallback image (SVG)

  static loadImageWithFallback(img, src, fallbackSrc = this.defaultImage) {
    return new Promise((resolve, reject) => {
      // Add loading class
      img.classList.add("image-loading");

      // Create a new image to preload
      const tempImg = new Image();

      tempImg.onload = () => {
        img.src = src;
        img.classList.remove("image-loading");
        img.classList.add("image-loaded");
        resolve(src);
      };

      tempImg.onerror = () => {
        // Try fallback image
        if (fallbackSrc && fallbackSrc !== src) {
          const fallbackImg = new Image();

          fallbackImg.onload = () => {
            img.src = fallbackSrc;
            img.classList.remove("image-loading");
            img.classList.add("image-fallback");
            img.alt = img.alt + " (fallback image)";
            resolve(fallbackSrc);
          };

          fallbackImg.onerror = () => {
            img.classList.remove("image-loading");
            img.classList.add("image-error");
            img.alt = "Image not available";
            img.style.display = "none";
            reject(
              new Error("Both primary and fallback images failed to load")
            );
          };

          fallbackImg.src = fallbackSrc;
        } else {
          img.classList.remove("image-loading");
          img.classList.add("image-error");
          img.alt = "Image not available";
          img.style.display = "none";
          reject(new Error("Image failed to load"));
        }
      };

      tempImg.src = src;
    });
  }

  static enhanceProductImages() {
    const productImages = document.querySelectorAll(".product-image");

    productImages.forEach((img) => {
      const originalSrc = img.src || img.dataset.src;

      if (originalSrc && !img.dataset.enhanced) {
        img.dataset.enhanced = "true";

        // Add error handling
        img.onerror = () => {
          this.loadImageWithFallback(img, originalSrc);
        };

        // Add loading indicator
        if (!img.complete) {
          img.classList.add("image-loading");

          img.onload = () => {
            img.classList.remove("image-loading");
            img.classList.add("image-loaded");
          };
        }
      }
    });
  }

  static initLazyLoading() {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;

            if (src) {
              this.loadImageWithFallback(img, src);
              img.dataset.src = ""; // Clear to prevent re-loading
            }

            observer.unobserve(img);
          }
        });
      });

      // Observe all images with data-src attribute
      const lazyImages = document.querySelectorAll("img[data-src]");
      lazyImages.forEach((img) => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      this.enhanceProductImages();
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ImageLoader.enhanceProductImages();
  });
} else {
  ImageLoader.enhanceProductImages();
}

// Make globally available
window.ImageLoader = ImageLoader;
