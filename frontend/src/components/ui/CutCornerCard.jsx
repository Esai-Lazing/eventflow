import React from "react";
import { cn } from "./Base";

export default function CutCornerCard({
  children,
  className = "",
  cut = ["top-right", "bottom-left"],
  size = 60,
  bgParent = "#9aa096", // couleur du fond global (la découpe)
  bg = "#e9ece7", // couleur de la carte elle-même
}) {
  return (
    <div className="relative inline-block w-full h-full">
      {/* Carte */}
      <div
        style={{ backgroundColor: bg }}
        className={cn(
          "relative rounded-[28px] overflow-hidden w-full h-full",
          className
        )}
      >
        {/* Découpes */}
        {cut.includes("top-right") && (
          <div
            className="absolute"
            style={{
              top: -size / 2,
              right: -size / 2,
              width: size,
              height: size,
              background: bgParent,
              borderRadius: "50%",
            }}
          />
        )}

        {cut.includes("top-left") && (
          <div
            className="absolute"
            style={{
              top: -size / 2,
              left: -size / 2,
              width: size,
              height: size,
              background: bgParent,
              borderRadius: "50%",
            }}
          />
        )}

        {cut.includes("bottom-right") && (
          <div
            className="absolute"
            style={{
              bottom: -size / 2,
              right: -size / 2,
              width: size,
              height: size,
              background: bgParent,
              borderRadius: "50%",
            }}
          />
        )}

        {cut.includes("bottom-left") && (
          <div
            className="absolute"
            style={{
              bottom: -size / 2,
              left: -size / 2,
              width: size,
              height: size,
              background: bgParent,
              borderRadius: "50%",
            }}
          />
        )}

        {/* Contenu */}
        <div className="relative z-10 w-full h-full p-6">{children}</div>
      </div>
    </div>
  );
}
