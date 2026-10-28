import {
  CivicAnalysisResponse,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  AIHealthResponse,
  PriorityLevel,
  LanguageCode,
} from '../types';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000'
).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  actionableTip?: string;

  constructor(message: string, status: number = 500, actionableTip?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.actionableTip = actionableTip;
  }
}

/**
 * Check backend service liveness
 */
export async function checkServiceHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new ApiError(`Service health returned HTTP ${res.status}`, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    return {
      status: 'demo',
      service: 'civiclens-ai-client-sandbox',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check AI provider connectivity and readiness
 */
export async function checkAIHealth(): Promise<AIHealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health/ai`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const detail = errorJson.detail || `AI health returned HTTP ${res.status}`;
      throw new ApiError(detail, res.status);
    }
    return await res.json();
  } catch {
    // When the remote backend is unreachable, gracefully present the Demo Sandbox status
    return {
      status: 'degraded',
      provider: 'gemini',
      model: 'gemini-3.5-flash-lite',
      configured: true,
      details: 'Operating in simulated civic sandbox mode (client fallback active).',
      actionable_tip: 'Connect a live backend URL to enable real-time cloud Gemini multimodal analysis.',
    };
  }
}

/**
 * Fetch list of discovered models
 */
export async function fetchAvailableModels(): Promise<{
  provider: string;
  configured_model: string;
  available_models: string[];
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return {
        provider: 'gemini',
        configured_model: 'gemini-3.5-flash-lite',
        available_models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemma3:1b'],
      };
    }
    return await res.json();
  } catch {
    return {
      provider: 'gemini',
      configured_model: 'gemini-3.5-flash-lite',
      available_models: ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemma3:1b'],
    };
  }
}

/**
 * Generate simulated civic analysis when remote backend is sleeping or unreachable
 */
function buildSimulatedCivicAnalysis(
  category: string,
  userDescription: string,
  language: LanguageCode = 'en',
  location: string = ''
): CivicAnalysisResponse {
  const isHi = language === 'hi';
  const cleanCat = category || 'Pothole / Road Damage';
  const now = new Date().toISOString();
  const analysisId = `analysis-sim-${Date.now()}`;
  const locNote = location.trim() ? location : '[Exact Location / Landmark]';

  if (cleanCat.includes('Garbage') || cleanCat.includes('Sanitation')) {
    return {
      analysis_id: analysisId,
      timestamp: now,
      language,
      category: 'Garbage Dump / Sanitation',
      issue_title: isHi
        ? 'सड़क किनारे अनियंत्रित कचरे का ढेर एवं स्वच्छता संकट'
        : 'Severe Uncollected Solid Waste & Sanitation Hazard',
      summary: isHi
        ? `${locNote} पर कचरे का भारी ढेर जमा है। दुर्गंध और सड़न से संक्रामक बीमारियों एवं मच्छरों के पनपने का खतरा है।`
        : `Accumulation of decomposed municipal solid waste and litter observed near ${locNote}. Poses severe public health risks and environmental degradation.`,
      visible_evidence: isHi
        ? [
            'सड़क किनारे खुले में पड़ा जैविक एवं अजैविक कचरा',
            'सड़ांध एवं कीड़े-मकोड़े पनपने की स्थिति',
            'कचरा पात्र का अभाव या ओवरफ्लो होना',
          ]
        : [
            'Extensive roadside heap of unsegregated organic and plastic waste',
            'Signs of decomposition, stagnant runoff, and vector breeding',
            'Obstruction of pedestrian footpath and foul odor dispersal',
          ],
      potential_impact: isHi
        ? ['हैजा, मलेरिया और डेंगू जैसी संक्रामक बीमारियों का खतरा', 'आसपास के रहवासियों और राहगीरों के लिए स्वास्थ्य संकट']
        : ['High risk of vector-borne epidemic spread (Dengue, Malaria, Cholera)', 'Air and groundwater contamination'],
      suggested_priority: 'High' as PriorityLevel,
      priority_reasoning: isHi
        ? 'जनस्वास्थ्य एवं स्वच्छता संकट, आवासीय क्षेत्र के निकट होने के कारण तत्काल समाधान आवश्यक।'
        : 'Sanitation emergency situated in an inhabited sector requiring urgent mechanized lifting.',
      responsible_department: isHi
        ? 'नगर निगम (Nagar Nigam) — ठोस अपशिष्ट प्रबंधन एवं स्वास्थ्य विभाग'
        : 'Municipal Corporation (Nagar Nigam) — Solid Waste Management Bureau',
      next_steps: isHi
        ? [
            'कचरे के ढेर से सुरक्षित दूरी बनाए रखें',
            'नगर निगम स्वास्थ्य अधिकारी को तत्काल शिकायत प्रेषित करें',
          ]
        : [
            'Maintain safe physical distance to avoid airborne biological contaminants',
            'Submit grievance to Ward Sanitary Inspector for mechanized compactor deployment',
          ],
      complaint_draft: {
        subject: isHi
          ? `अनियंत्रित कचरे के ढेर की तत्काल सफाई एवं उठान हेतु शिकायत`
          : `Urgent Request for Immediate Clearance of Overflowing Solid Waste at ${locNote}`,
        to_authority: isHi
          ? 'मुख्य नगर स्वास्थ्य अधिकारी / वार्ड स्वच्छता निरीक्षक, नगर निगम'
          : 'The Chief Municipal Health Officer / Sanitary Inspector, Nagar Nigam',
        body: isHi
          ? `सेवा में,\nमुख्य नगर स्वास्थ्य अधिकारी,\nनगर निगम, [Ward Number]\n\nविषय: ${locNote} पर कचरे के ढेर की तत्काल सफाई हेतु।\n\nमहोदय,\n\nसविनय निवेदन है कि ${locNote} पर पिछले कई दिनों से भारी मात्रा में कचरा सड़ रहा है। कचरे के नियमित उठान के अभाव में पूरे क्षेत्र में असहनीय दुर्गंध फैली हुई है तथा मच्छरों और संक्रामक बीमारियों का प्रकोप बढ़ रहा है।\n\n${userDescription ? `अतिरिक्त विवरण: ${userDescription}\n\n` : ''}अतः आपसे विनम्र अनुरोध है कि स्वच्छता दल भेजकर तुरंत कचरे का निस्तारण करवाएं एवं नियमित सफाई व्यवस्था सुनिश्चित करें।\n\nसधन्यवाद,\n[Citizen Name]\n[Contact Number]\n[Date]`
          : `To,\nThe Chief Municipal Health Officer / Sanitary Inspector,\nMunicipal Corporation,\n[Ward Number]\n\nSubject: Urgent Request for Immediate Clearance of Solid Waste Heap at ${locNote}\n\nRespected Sir/Madam,\n\nI am writing to formally bring to your urgent attention the severe accumulation of uncollected municipal solid waste at ${locNote}. The garbage has remained unattended for an extended period, creating hazardous sanitary conditions, unbearable stench, and breeding grounds for disease vectors.\n\n${userDescription ? `Specific citizen observation: ${userDescription}\n\n` : ''}I earnestly request the deployment of a mechanized waste compactor and cleaning crew to lift this dump immediately and sanitize the premises.\n\nThank you for your prompt assistance in safeguarding public hygiene.\n\nSincerely,\n[Citizen Name]\n[Contact Number]\n[Date]`,
        recommended_portal: 'Swachhata App / Nagar Nigam Citizen Helpline / CPGRAMS',
      },
      ai_provider: 'gemini',
      model_used: 'gemini-3.5-flash-lite (Simulated Demo Sandbox)',
      disclaimer: 'DEMO MODE: Generated in simulated civic sandbox. Preliminary recommendations for citizen redressal.',
    };
  }

  if (cleanCat.includes('Streetlight') || cleanCat.includes('Electrical')) {
    return {
      analysis_id: analysisId,
      timestamp: now,
      language,
      category: 'Streetlight / Electrical',
      issue_title: isHi
        ? 'खुला विद्युत जंक्शन बॉक्स अथवा लटकते तारों से गंभीर खतरा'
        : 'Dangerous Exposed Electrical Hazard / Non-Functional Streetlight',
      summary: isHi
        ? `${locNote} पर बिजली के खुले तार या बंद स्ट्रीटलाइट देखी गई है, जिससे करंट लगने और दुर्घटना का भारी जोखिम है।`
        : `Exposed electrical wiring or critical street lighting failure observed near ${locNote}. Poses electrocution and public safety danger.`,
      visible_evidence: isHi
        ? ['खुले जंक्शन बॉक्स में नंगे विद्युत तार', 'जमीनी स्तर पर सुरक्षा आवरण का अभाव', 'रात में अंधेरा और पैदल यात्रियों के लिए जोखिम']
        : ['Exposed high-voltage conduit or dangling low-tension cables', 'Damaged or absent safety junction cover plate', 'Unlit thoroughfare contributing to nighttime visibility hazard'],
      potential_impact: isHi
        ? ['बारिश या आकस्मिक स्पर्श से जानलेवा करंट का खतरा', 'रात में अंधेरे के कारण सड़क दुर्घटनाएं और असुरक्षा']
        : ['Fatal electrocution risk to pedestrians and stray animals', 'Heightened risk of nighttime vehicular collisions'],
      suggested_priority: 'Critical' as PriorityLevel,
      priority_reasoning: isHi
        ? 'जीवन सुरक्षा के लिए प्रत्यक्ष खतरा, 24 घंटे के भीतर बिजली विभाग द्वारा मरम्मत अनिवार्य।'
        : 'Imminent life safety hazard requiring immediate disconnection or insulation within 24 hours.',
      responsible_department: isHi
        ? 'विद्युत वितरण निगम (Discom) — नगर विद्युत रखरखाव खंड'
        : 'State Electricity Distribution Company (Discom) / Municipal Lighting Division',
      next_steps: isHi
        ? ['खुले तारों से कम से कम 5 मीटर की दूरी रखें', 'बिजली विभाग के आपातकालीन नंबर पर तुरंत सूचित करें']
        : ['Maintain a minimum 5-meter exclusion zone around exposed electrical fixtures', 'Escalate immediately to electrical feeder emergency helpline'],
      complaint_draft: {
        subject: isHi
          ? `अत्यंत गंभीर: खुले विद्युत तारों एवं जंक्शन बॉक्स की आपातकालीन मरम्मत हेतु`
          : `CRITICAL SAFETY ALERT: Urgent Repair of Exposed Live Electrical Fixture at ${locNote}`,
        to_authority: isHi
          ? 'सहायक अभियंता / कनिष्ठ अभियंता, विद्युत वितरण निगम'
          : 'The Assistant Executive Engineer (Electrical), Electricity Distribution Division',
        body: isHi
          ? `सेवा में,\nसहायक यंत्री (विद्युत),\nविद्युत वितरण कंपनी, [Substation Name]\n\nविषय: ${locNote} पर खुले विद्युत तारों की आपातकालीन मरम्मत बाबत।\n\nमहोदय,\n\nअत्यंत आदरपूर्वक सूचित करना है कि ${locNote} पर बिजली के नंगे तार और खुला जंक्शन बॉक्स जमीन के पास असुरक्षित अवस्था में है। किसी भी राहगीर या मवेशी के छू जाने से जानलेवा हादसा हो सकता है।\n\n${userDescription ? `अतिरिक्त टिप्पणी: ${userDescription}\n\n` : ''}कृपया जनहित में विद्युत आपूर्ति रोककर इसे तुरंत दुरुस्त करवाने की कृपा करें।\n\nभवदीय,\n[Citizen Name]\n[Contact Number]\n[Date]`
          : `To,\nThe Assistant Executive Engineer,\nElectricity Distribution Corporation,\n[Substation Division]\n\nSubject: CRITICAL SAFETY ALERT: Urgent Repair of Exposed Live Wire at ${locNote}\n\nRespected Sir/Madam,\n\nI am writing to urgently report an immediate electrical hazard at ${locNote}. Live electrical cabling / junction infrastructure is exposed without protective insulation or enclosure, situated along an active pedestrian path.\n\n${userDescription ? `Citizen observation: ${userDescription}\n\n` : ''}Considering the severe electrocution hazard, I urge your quick-response emergency line team to inspect and insulate this installation immediately.\n\nSincerely,\n[Citizen Name]\n[Contact Number]\n[Date]`,
        recommended_portal: 'Electricity Board 24x7 Helpline (1912) / Discom Portal',
      },
      ai_provider: 'gemini',
      model_used: 'gemini-3.5-flash-lite (Simulated Demo Sandbox)',
      disclaimer: 'DEMO MODE: Generated in simulated civic sandbox. Preliminary recommendations for citizen redressal.',
    };
  }

  // Default: Pothole / Road Damage / Drainage / General
  return {
    analysis_id: analysisId,
    timestamp: now,
    language,
    category: cleanCat,
    issue_title: isHi
      ? 'सड़क पर गहरा गड्ढा एवं यातायात सुरक्षा जोखिम'
      : 'Severe Road Crater & Traffic Safety Hazard',
    summary: isHi
      ? `${locNote} पर सड़क की सतह गंभीर रूप से क्षतिग्रस्त है। गहरे गड्ढों और बिखरी गिट्टी के कारण आवागमन बाधित एवं दुर्घटना की आशंका है।`
      : `Extensive pavement degradation and deep pothole crater observed at ${locNote}. Poses severe vehicular jarring, skidding risks, and pedestrian hazards.`,
    visible_evidence: isHi
      ? [
          'सड़क की ऊपरी डामर परत उखड़ चुकी है एवं बजरी बिखरी है',
          'गड्ढे की गहराई 10 से 15 सेंटीमीटर से अधिक प्रतीत होती है',
          'दोपहिया वाहनों के अचानक ब्रेक लगाने से दुर्घटना की आशंका',
        ]
      : [
          'Fragmented bituminous wearing surface exposing coarse sub-base aggregate',
          'Deep crater depression spanning across active transit corridor',
          'Hazardous edge fractures capable of skidding motorized two-wheelers',
        ],
    potential_impact: isHi
      ? [
          'दोपहिया वाहन चालकों के फिसलने और गंभीर चोट लगने का खतरा',
          'कार और ऑटो के पहियों व सस्पेंशन को भारी नुकसान',
          'व्यस्त समय में भारी ट्रैफिक जाम की समस्या',
        ]
      : [
          'High probability of two-wheeler skidding, balance loss, and fatal spills',
          'Severe suspension damage and tire blowout for commuting vehicles',
          'Traffic chokepoints and deceleration during peak transit hours',
        ],
    suggested_priority: 'High' as PriorityLevel,
    priority_reasoning: isHi
      ? 'सड़क पर गड्ढे से सीधा जीवन संकट और दैनिक दुर्घटनाओं की आशंका, त्वरित पैचवर्क अनिवार्य।'
      : 'Active arterial thoroughfare with pronounced depth crater creating acute accident risks.',
    responsible_department: isHi
      ? 'लोक निर्माण विभाग (PWD) / नगर निगम सड़क रखरखाव प्रकोष्ठ'
      : 'Public Works Department (PWD) / Municipal Road Maintenance Division',
    next_steps: isHi
      ? [
          'इस मार्ग से गुजरते समय वाहनों की गति धीमी रखें',
          'सड़क निर्माण विभाग को शिकायत प्रेषित कर तत्काल पैचवर्क की मांग करें',
        ]
      : [
          'Navigate with low transit speed and avoid traversing over edges during wet weather',
          'Submit this structured grievance to the Executive Engineer for cold-mix patch filling',
        ],
    complaint_draft: {
      subject: isHi
        ? `सड़क पर गहरे गड्ढों की तत्काल मरम्मत एवं पुनर्निर्माण हेतु शिकायत`
        : `Urgent Request for Road Resurfacing and Pothole Repair at ${locNote}`,
      to_authority: isHi
        ? 'कार्यपालन यंत्री, लोक निर्माण विभाग / नगर निगम'
        : 'The Executive Engineer, Public Works Department (PWD) / Municipal Corporation',
      body: isHi
        ? `सेवा में,\nकार्यपालन यंत्री महोदय,\nलोक निर्माण विभाग / नगर निगम, [Ward Number]\n\nविषय: ${locNote} पर सड़क के गड्ढों की तत्काल मरम्मत बाबत।\n\nमहोदय,\n\nसविनय निवेदन है कि ${locNote} पर सड़क की स्थिति अत्यंत जर्जर हो चुकी है। सड़क पर बड़े-बड़े गड्ढे हो गए हैं, जिससे आए दिन दोपहिया वाहन चालक गिरकर चोटिल हो रहे हैं।\n\n${userDescription ? `नागरिक द्वारा दर्ज विवरण: ${userDescription}\n\n` : ''}अतः आपसे विनम्र निवेदन है कि जनहित एवं सड़क सुरक्षा को ध्यान में रखते हुए इस सड़क का शीघ्र निरीक्षण कर पैचवर्क और पुनर्निर्माण का कार्य करवाने की कृपा करें।\n\nधन्यवाद।\n\nभवदीय,\n[Citizen Name]\n[Contact Number]\n[Date]`
        : `To,\nThe Executive Engineer,\nPublic Works Department (PWD) / Municipal Corporation,\n[Ward Number]\n\nSubject: Urgent Request for Road Resurfacing and Pothole Repair at ${locNote}\n\nRespected Sir/Madam,\n\nI am writing to formally report the hazardous road condition and deep pothole craters observed at ${locNote}. The pavement surface is severely degraded with loose gravel and sharp crater edges, creating imminent risks of accidents for two-wheeler riders, motorists, and pedestrians.\n\n${userDescription ? `Specific citizen observation: ${userDescription}\n\n` : ''}I earnestly request an on-site engineering assessment and prompt patch repair / resurfacing work on an urgent basis to safeguard public commuters.\n\nThank you for your timely intervention.\n\nSincerely,\n[Citizen Name]\n[Contact Number]\n[Date]`,
      recommended_portal: 'CPGRAMS / State PWD Portal / Municipal Grievance Cell',
    },
    ai_provider: 'gemini',
    model_used: 'gemini-3.5-flash-lite (Simulated Demo Sandbox)',
    disclaimer: 'DEMO MODE: Generated in simulated civic sandbox. Preliminary recommendations for citizen redressal.',
  };
}

/**
 * Submit civic evidence (image, category, description, language) for AI analysis
 */
export async function analyzeCivicIssue(
  formData: FormData
): Promise<CivicAnalysisResponse> {
  const category = (formData.get('category') as string) || 'Pothole / Road Damage';
  const description = (formData.get('description') as string) || '';
  const language = ((formData.get('language') as string) || 'en') as LanguageCode;
  const location = (formData.get('location') as string) || '';

  try {
    const res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let detailMsg = `Analysis failed with HTTP ${res.status}`;
      let actionableTip: string | undefined;

      try {
        const errorData = await res.json();
        if (errorData.detail) {
          detailMsg = errorData.detail;
        }
      } catch {
        // fallback
      }

      if (res.status === 401) {
        actionableTip = 'Set a valid GEMINI_API_KEY in backend/.env or your deployment environment.';
      } else if (res.status === 413) {
        actionableTip = 'Please upload an image smaller than 10MB.';
      } else if (res.status === 415) {
        actionableTip = 'Upload a JPEG, PNG, or WEBP image.';
      } else if (res.status === 503) {
        actionableTip = 'Ensure the configured AI provider is running.';
      } else if (res.status === 504) {
        actionableTip = 'The AI inference timed out. Please try again.';
      }

      throw new ApiError(detailMsg, res.status, actionableTip);
    }

    return await res.json();
  } catch (err: any) {
    // If the server explicitly rejected the image (e.g. 413 Too Large, 415 Invalid Format), preserve that error
    if (err instanceof ApiError && err.status !== 0 && err.status !== 503) {
      throw err;
    }

    // Backend server is offline, sleeping on Render, or VITE_API_URL not configured:
    // Seamlessly fall back to client-side simulated AI analysis so the demo NEVER crashes!
    return buildSimulatedCivicAnalysis(category, description, language, location);
  }
}

/**
 * Send interactive citizen inquiry to the AI civic assistant
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const detail = errorJson.detail || `Chat request failed with HTTP ${res.status}`;
      throw new ApiError(detail, res.status);
    }

    return await res.json();
  } catch {
    // Graceful simulated civic assistant response
    const query = request.message.toLowerCase();
    let reply =
      'Hello citizen! I am CivicLens AI Assistant. In this demo environment, I can guide you on reporting municipal hazards like potholes, illegal dumping, streetlights, and drainage issues. You can also file formal grievances or inspect status tracking in the tabs above.';

    if (query.includes('rti') || query.includes('right to information')) {
      reply =
        'To file a Right to Information (RTI) application for pending civic work:\n1. Identify the Public Information Officer (PIO) of the concerned department (e.g., PWD or Municipal Corporation).\n2. Submit Form A with the requisite ₹10 fee.\n3. The department is mandated under law to provide records within 30 days.';
    } else if (query.includes('pothole') || query.includes('road')) {
      reply =
        'For pothole complaints, the Public Works Department (PWD) and local Municipal Corporation have a standard SLA of 48 hours for arterial road leveling. You can submit your photo evidence above to generate a formal inspection letter.';
    } else if (query.includes('garbage') || query.includes('waste')) {
      reply =
        'Solid waste heaps must be cleared within 24 hours under Nagar Nigam sanitation guidelines. You can report overflowing bins on the Swachhata mobile app or through your municipal ward helpline.';
    }

    return {
      reply,
      suggested_questions: [
        'How do I escalate my complaint to the Ward Councilor?',
        'What is the standard SLA for repairing potholes?',
        'How can I file an RTI appeal for delayed civic repairs?',
      ],
      provider: 'gemini',
      model: 'gemini-3.5-flash-lite (Simulated Demo Assistant)',
    };
  }
}
