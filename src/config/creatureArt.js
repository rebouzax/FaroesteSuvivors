// Model choices follow anatomy. Distinct equipment is applied per bestiary ID.
export const CREATURE_ART={
  bat:'bats-01',skeleton:'skeleton-01',wraith:'ghost',mineSpider:'aranha-1',mineSkull:'caveira-voadora',blindCrawler:'dun-rat',townZombie:'zombie-1',townGhoul:'ghoul',headlessOutlaw:'esqueleto-sem-cabeca',canyonViper:'cobra',redScorpion:'scropiao',ridgeWolf:'lobo',graveSkeleton:'dun-skeleton',cryptSpider:'aranha-1',deathWisp:'ghost-2',graveZombie:'zombie-1',
  bellRinger:'dun-skeleton',dustCoyote:'lobo',lanternThief:'esqueleto-sem-cabeca',windmillWraith:'ghost',reedStalker:'ghoul',drownedProspector:'zombie-1',cardsharpGhoul:'ghoul',barBanshee:'ghost-2',whiskeyImp:'ghoul',railWitch:'dama-malvina',graveRider:'lobo',sundownBandit:'esqueleto-sem-cabeca',rattlesnake:'cobra',
  saltScorpion:'scropiao',mirageGunner:'esqueleto-sem-cabeca',brineMiner:'zombie-1',saltWidow:'aranha-1',bleachedJackal:'lobo',crystalWisp:'caveira-voadora',slagHound:'lobo',furnaceKeeper:'gigante',rivetImp:'ghoul',chainWorker:'zombie-1',ashWelder:'esqueleto-sem-cabeca',bellowsBat:'bats-01',moonAcolyte:'dun-skeleton',waxPenitent:'zombie-1',scriptureWraith:'ghost',silverLynx:'lobo',astralMonk:'skeleton-01',orchardReaper:'morte',sapCrawler:'aranha-1',dawnExile:'dama-malvina',riftHound:'lobo',obeliskGuard:'gigante',sunlessGunslinger:'esqueleto-sem-cabeca',
  giantBat:'bats-01',minerGeneral:'gigante',boneSinger:'skeleton-01',zombieDeputy:'zombie-1',ashSerpent:'cobra',cryptMother:'aranha-1',deadPreacher:'morte',lastConductor:'esqueleto-sem-cabeca',bellTowerKeeper:'gigante',windmillWidow:'ghost',mudKing:'gigante',drownedBride:'ghost',bottleBaron:'zombie-1',damaMalvina:'dama-malvina',railWitchQueen:'morte',clanker:'clanker',saltColossus:'gigante',mirageQueen:'dama-malvina',chainForeman:'gigante',eclipseAbbot:'morte',briarMatriarch:'ghoul',lastEclipse:'morte',
};
export const MODEL_KINDS={
 'morte':'spectral',
 'bats-01':'bird','caveira-voadora':'spectral','aranha-1':'arthropod','dun-rat':'quadruped','lobo':'quadruped','cobra':'quadruped','scropiao':'arthropod','ghost':'spectral','ghost-2':'spectral',
};
export const SPECIAL_ART={
  mireLeech:'leech',pianoCrawler:'piano',coalMimic:'mimic',ironLocust:'insect',boneCactus:'cactus',glassMoth:'moth',copperHornet:'insect',eclipseOwl:'owl',candleMoth:'moth',thornBoar:'boar',rootSentinel:'tree',venomBloom:'flower',cinderSeraph:'seraph',
  giantMoth:'moth',ironLocomotive:'train',boneCactusMatriarch:'cactus',furnaceBull:'bull',moonDevourer:'owl',venomStag:'stag',hollowSeraph:'seraph',
};
export const AIRBORNE_ART=new Set(['bats-01','caveira-voadora','moth','insect','owl','seraph']);
