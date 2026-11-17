import { useState, type ReactNode } from "react";
import { asset } from "../content";

type Props = { file: string; alt?: string; className?: string; fallback?: ReactNode; eager?: boolean; width?: number; height?: number };

/** Image from /public/assets that degrades gracefully if the file hasn't been added yet. */
export default function SafeImg({ file, alt = "", className, fallback = null, eager, width, height }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <img
      src={asset(file)}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
