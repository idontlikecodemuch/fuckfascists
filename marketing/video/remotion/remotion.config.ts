import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
// The media symlink under public/ points at marketing/video (5 GB of captures);
// forward it as a symlink instead of copying it into the bundle.
Config.setPublicDir('./public');
