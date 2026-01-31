export const SKILLS = {
  fireball: {
    name:"Fireball",
    icon:"./assets/skills/fireball.svg",
    mpCost:6,
    power:10,
    desc:"Serangan api (damage tinggi)."
  }
};

export const ITEMS = {
  potion: { name:"Potion", kind:"heal_hp", amount:25, desc:"Memulihkan 25 HP" },
  ether:  { name:"Ether",  kind:"heal_mp", amount:10, desc:"Memulihkan 10 MP" }
};

export const ENEMY_NAMES = ["Slime","Goblin","Bandit","Wolf","Skeleton"];
export const ENEMY_AVATARS = {
  Slime: { image: "./assets/enemies/slime.png" },
  Goblin: { image: "./assets/enemies/goblin.png" },
  Wolf: { image: "./assets/enemies/wolf.png" },
  Skeleton: { image: "./assets/enemies/skeleton.png" },
};

export const RECRUIT_TEMPLATES = [
  {
    id: "guardian",
    name: "Guardian",
    role: "Tank",
    desc: "HP tinggi, cocok jadi tameng tim.",
    base: { maxHp: 70, maxMp: 15, atk: 6, def: 7, spd: 4 },
    growth: { maxHp: 8, maxMp: 2, atk: 1, def: 2, spd: 1 },
    costBase: 35,
    costPerLevel: 7,
  },
  {
    id: "ranger",
    name: "Ranger",
    role: "Striker",
    desc: "Serangan cepat dengan damage stabil.",
    base: { maxHp: 50, maxMp: 20, atk: 8, def: 4, spd: 7 },
    growth: { maxHp: 6, maxMp: 3, atk: 2, def: 1, spd: 2 },
    costBase: 30,
    costPerLevel: 6,
  },
  {
    id: "mystic",
    name: "Mystic",
    role: "Support",
    desc: "MP tinggi, membantu lewat serangan sihir.",
    base: { maxHp: 45, maxMp: 30, atk: 7, def: 3, spd: 5 },
    growth: { maxHp: 5, maxMp: 5, atk: 2, def: 1, spd: 1 },
    costBase: 32,
    costPerLevel: 6,
  },
];
