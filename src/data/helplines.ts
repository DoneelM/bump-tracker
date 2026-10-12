/**
 * Free New Zealand phone lines and support organisations, checked against each one's own site
 * (see `sources.ts`). `tel` / `sms` are dialable; `url` is the organisation's site.
 */

export interface Helpline {
  id: string;
  name: string;
  /** What it's for, in a few words. */
  what: string;
  /** Number as shown. */
  number?: string;
  tel?: string;
  sms?: string;
  url?: string;
  /** Id in `sources.ts`; 111 needs none. */
  source?: string;
}

export const EMERGENCY: Helpline = {
  id: '111',
  name: 'Emergency',
  what: 'Ambulance, fire or police',
  number: '111',
  tel: 'tel:111',
};

export const HEALTHLINE: Helpline = {
  id: 'healthline',
  name: 'Healthline',
  what: 'Free health advice, 24/7',
  number: '0800 611 116',
  tel: 'tel:0800611116',
  source: 'healthnz-healthline',
};

export const PLUNKETLINE: Helpline = {
  id: 'plunketline',
  name: 'PlunketLine',
  what: 'Free parenting and child health advice from Plunket nurses, 24/7',
  number: '0800 933 922',
  tel: 'tel:0800933922',
  source: 'plunketline',
};

export const NEED_TO_TALK: Helpline = {
  id: '1737',
  name: '1737, Need to talk?',
  what: 'Free call or text, 24/7, for support from a trained counsellor',
  number: '1737',
  tel: 'tel:1737',
  sms: 'sms:1737',
  source: 'need-to-talk-1737',
};

export const SANDS: Helpline = {
  id: 'sands',
  name: 'Sands New Zealand',
  what: 'Support from parents whose baby died at any stage of pregnancy, or as a baby',
  url: 'https://www.sands.org.nz/',
  source: 'sands-nz',
};

export const MISCARRIAGE_SUPPORT: Helpline = {
  id: 'miscarriage-support',
  name: 'Miscarriage Support',
  what: 'Information and support after miscarriage, from volunteers who have been there',
  url: 'https://www.miscarriagesupport.org.nz/',
  source: 'miscarriage-support-nz',
};

export const LIFELINE: Helpline = {
  id: 'lifeline',
  name: 'Lifeline',
  what: 'Free confidential support, 24/7. Or text HELP to 4357',
  number: '0800 543 354',
  tel: 'tel:0800543354',
  source: 'pada-get-help',
};

export const SAMARITANS: Helpline = {
  id: 'samaritans',
  name: 'Samaritans',
  what: 'Confidential, non-judgemental support, 24/7',
  number: '0800 726 666',
  tel: 'tel:0800726666',
  source: 'pada-get-help',
};

export const PADA: Helpline = {
  id: 'pada',
  name: 'PADA',
  what: 'Perinatal Anxiety & Depression Aotearoa: information and local support services',
  url: 'https://pada.nz/get-help-now/',
  source: 'pada-get-help',
};
