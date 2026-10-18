import type { components } from '../../shared/api/schema';

type Listing = components['schemas']['MyListingsResponseDto']['items'][number];

export const SHELTER_ID = '99999999-9999-9999-9999-999999999999';

// stock photos from Unsplash, cropped to 4:3 and served from public/demo, so a visitor's
// browser asks nobody else for them. who took each one is in public/demo/CREDITS.md
export const photos = (...names: string[]) => ({
  photoKeys: names.map((name) => `demo/${name}`),
  photoUrls: names.map((name) => `/demo/${name}.webp`),
});

const base = {
  status: 'APPROVED',
  rejectionReason: null,
  source: 'WEB',
  shelterId: null,
  sourceUrl: null,
} as const;

// enough of a board to pan around, filter and page through, spread over the places people
// in Lisbon actually lose a cat. points carry three decimals, like the real public ones
export const board: Listing[] = [
  {
    ...base,
    id: '22222222-2222-2222-2222-222222222222',
    ...photos('brown-dog', 'brown-dog-2'),
    type: 'FOUND',
    species: 'DOG',
    city: 'Lisboa',
    lat: 38.722,
    lng: -9.139,
    description:
      'Friendly brown dog near the park in Arroios, no collar, very calm with people. Staying with me for now.',
    createdAt: '2026-10-16T18:40:00.000Z',
  },
  {
    ...base,
    id: '77777777-7777-7777-7777-777777777777',
    ...photos('grey-cat-collar', 'grey-cat'),
    type: 'LOST',
    species: 'CAT',
    city: 'Lisboa',
    lat: 38.711,
    lng: -9.13,
    description:
      'Grey cat with a red collar, missing since Friday around Graça. Scared of strangers, answers to Fumo.',
    createdAt: '2026-10-15T21:05:00.000Z',
  },
  {
    ...base,
    id: '88888888-8888-8888-8888-888888888888',
    ...photos('shelter-dog'),
    type: 'ADOPTION',
    species: 'DOG',
    city: 'Lisboa',
    lat: 38.751,
    lng: -9.15,
    source: 'FEED',
    shelterId: SHELTER_ID,
    sourceUrl: 'https://abrigo.example.pt/animais/tejo',
    description: 'Tejo: mestizo, four years old, house-trained and ready to go home.',
    createdAt: '2026-10-14T09:00:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000001',
    ...photos('calico-cat'),
    type: 'FOUND',
    species: 'CAT',
    city: 'Lisboa',
    lat: 38.714,
    lng: -9.16,
    description:
      'Gatinha tricolor encontrada em Campo de Ourique, muito meiga. Parece habituada a casa.',
    createdAt: '2026-10-14T19:30:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000002',
    ...photos('small-brown-dog'),
    type: 'LOST',
    species: 'DOG',
    city: 'Almada',
    lat: 38.679,
    lng: -9.158,
    description:
      'Perdemos o Bolt, um podengo pequeno castanho, perto do Cristo Rei. Tem chip. Pode fugir se o chamarem alto.',
    createdAt: '2026-10-13T08:15:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000003',
    ...photos('black-cat'),
    type: 'ADOPTION',
    species: 'CAT',
    city: 'Lisboa',
    lat: 38.756,
    lng: -9.141,
    source: 'FEED',
    shelterId: SHELTER_ID,
    sourceUrl: 'https://abrigo.example.pt/animais/luna',
    description:
      'Luna: two-year-old black cat, sterilised, gets on with other cats but not with dogs.',
    createdAt: '2026-10-12T09:00:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000004',
    ...photos('white-rabbit'),
    type: 'FOUND',
    species: 'OTHER',
    city: 'Oeiras',
    lat: 38.693,
    lng: -9.31,
    description:
      "White rabbit found in a garden near the Marquês de Pombal palace. Clearly somebody's, very tame.",
    createdAt: '2026-10-11T16:45:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000005',
    ...photos('grey-parrot'),
    type: 'LOST',
    species: 'OTHER',
    city: 'Lisboa',
    lat: 38.707,
    lng: -9.199,
    description:
      'Our grey parrot flew off a balcony in Belém on Sunday. He whistles the start of a fado song and says "olá".',
    createdAt: '2026-10-11T10:20:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000006',
    ...photos('black-dog'),
    type: 'FOUND',
    species: 'DOG',
    city: 'Amadora',
    lat: 38.754,
    lng: -9.23,
    description:
      'Cão preto de porte médio a vaguear junto à estação da Reboleira. Muito dócil, deixa-se apanhar.',
    createdAt: '2026-10-10T07:50:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000007',
    ...photos('orange-tabby'),
    type: 'LOST',
    species: 'CAT',
    city: 'Cascais',
    lat: 38.697,
    lng: -9.421,
    description:
      'Orange tabby, neutered male, went missing near the citadel. Indoor cat, so he will be hiding nearby.',
    createdAt: '2026-10-09T20:10:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000008',
    ...photos('old-dog'),
    type: 'ADOPTION',
    species: 'DOG',
    city: 'Lisboa',
    lat: 38.749,
    lng: -9.146,
    source: 'FEED',
    shelterId: SHELTER_ID,
    sourceUrl: 'https://abrigo.example.pt/animais/pipoca',
    description: 'Pipoca: small, nine years old, sleeps most of the day. Would suit a quiet flat.',
    createdAt: '2026-10-08T09:00:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000009',
    ...photos('silver-kitten'),
    type: 'FOUND',
    species: 'CAT',
    city: 'Lisboa',
    lat: 38.736,
    lng: -9.103,
    description:
      'Kitten, maybe eight weeks, found under a car in Marvila. Eating well, already checked by a vet.',
    createdAt: '2026-10-07T13:25:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000010',
    ...photos('golden-retriever'),
    type: 'LOST',
    species: 'DOG',
    city: 'Sintra',
    lat: 38.798,
    lng: -9.388,
    description:
      'Golden retriever velho, a Mel, perdeu-se num trilho na serra. Anda devagar e ouve mal.',
    createdAt: '2026-10-06T17:40:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000011',
    ...photos('white-terrier'),
    type: 'FOUND',
    species: 'DOG',
    city: 'Lisboa',
    lat: 38.769,
    lng: -9.096,
    description:
      'Small white terrier running along the river at Parque das Nações, very thirsty. Has a microchip scar.',
    createdAt: '2026-10-05T09:05:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000012',
    ...photos('siamese', 'siamese-2'),
    type: 'LOST',
    species: 'CAT',
    city: 'Lisboa',
    lat: 38.713,
    lng: -9.144,
    description:
      'Siamese, blue eyes, lost in Chiado after the front door was left open. She is shy and very vocal.',
    createdAt: '2026-10-04T22:30:00.000Z',
  },
  {
    ...base,
    id: 'a0000000-0000-0000-0000-000000000013',
    ...photos('roof-cat'),
    type: 'FOUND',
    species: 'CAT',
    city: 'Almada',
    lat: 38.664,
    lng: -9.174,
    description:
      'Gato cinzento muito magro nos telhados junto à praia da Costa, aproxima-se de quem tem comida. Já tem abrigo temporário.',
    createdAt: '2026-10-03T11:15:00.000Z',
  },
];
