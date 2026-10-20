import { LITERACY_MOCK_V11_AUDIO_BY_ROLE } from './generated/literacyMockAudioV11.generated.js';
import { normalizeLedaAudioText } from './normalizeLedaAudioText.js';
// New V11-only scripts must not change a historical publication's resolver.
export function getLiteracyMockAudioV11Path(text, roles = ['isolated_word','assessment_prompt','assessment_passage']) {
 const key=normalizeLedaAudioText(text);
 for(const role of roles){const path=LITERACY_MOCK_V11_AUDIO_BY_ROLE[role]?.[key];if(path)return path;}
 return '';
}
