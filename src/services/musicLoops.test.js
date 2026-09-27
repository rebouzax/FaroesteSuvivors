import { it,expect } from "vitest";
import { AudioService,GAME_MUSIC_LOOPS } from "./AudioService.js";
it.each([
  ["saltFlats",147,0],["emberFoundry",168,0],["moonMonastery",177,0],["thornGarden",169,8],
])("%s repete no ponto solicitado, mantendo o início da primeira execução",(track,end,start)=>{
  expect(GAME_MUSIC_LOOPS[track]).toEqual({start,end});
  const audio=new AudioService();audio.track=track;audio.playingTrack=track;audio.musicSource={currentTime:0};
  audio.updateMusicLoop();expect(audio.musicSource.currentTime).toBe(0);
  audio.musicSource.currentTime=end;audio.updateMusicLoop();expect(audio.musicSource.currentTime).toBe(start);
  audio.musicSource.currentTime=end+.1;audio.updateMusicLoop();expect(audio.musicSource.currentTime).toBeCloseTo(start+.1);
});
