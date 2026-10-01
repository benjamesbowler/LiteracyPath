#!/usr/bin/env bash
# FFmpeg 8.1.2 reproduces the stored scene provenance probes. Ubuntu's older
# decoder reports different MP3 container durations for the same SHA-256 bytes.
# Pin the verifier rather than relaxing exact media-identity checks.
set -euo pipefail

task_ffmpeg_prefix="${1:-${RUNNER_TEMP:?Pass an installation directory}/literacy-verification-ffmpeg-8.1.2}"
task_ffmpeg_version=8.1.2
task_ffmpeg_sha256=464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c
task_ffmpeg_build="$(mktemp -d)"
trap 'rm -rf "$task_ffmpeg_build"' EXIT

curl --fail --location --silent --show-error \
  "https://ffmpeg.org/releases/ffmpeg-${task_ffmpeg_version}.tar.xz" \
  -o "$task_ffmpeg_build/source.tar.xz"
printf '%s  %s\n' "$task_ffmpeg_sha256" "$task_ffmpeg_build/source.tar.xz" | shasum -a 256 -c -
tar -xf "$task_ffmpeg_build/source.tar.xz" -C "$task_ffmpeg_build"
cd "$task_ffmpeg_build/ffmpeg-${task_ffmpeg_version}"

# Only the decoders, PCM outputs and signal filters used by verification are
# built. This is an offline verifier, not a replacement authoring installation.
./configure --prefix="$task_ffmpeg_prefix" \
  --disable-everything --disable-autodetect --disable-x86asm \
  --disable-doc --disable-network --disable-debug \
  --enable-ffmpeg --enable-ffprobe \
  --enable-protocol=file,pipe --enable-demuxer=mp3,wav \
  --enable-decoder=mp3,mp3float,pcm_s16le,pcm_f32le \
  --enable-parser=mpegaudio --enable-encoder=pcm_s16le,pcm_f32le \
  --enable-muxer=null,s16le,f32le,wav \
  --enable-filter=volumedetect,aresample,anull
make -j "$(getconf _NPROCESSORS_ONLN)"
make install
"$task_ffmpeg_prefix/bin/ffmpeg" -version
"$task_ffmpeg_prefix/bin/ffprobe" -version
if [[ -n "${GITHUB_PATH:-}" ]]; then
  printf '%s\n' "$task_ffmpeg_prefix/bin" >> "$GITHUB_PATH"
fi
