export const SKILLS = {
  fireball: { name: "Fireball", icon: "./assets/skills/fireball.svg", mpCost: 6, power: 10, cooldown: 3, desc: "Serangan api (damage tinggi)." },
  spark: { name: "Spark", icon: "./assets/skills/spark.svg", mpCost: 3, power: 6, cooldown: 2, desc: "Sambaran listrik ringan." },
  frostBite: { name: "Frost Bite", icon: "./assets/skills/frost-bite.svg", mpCost: 5, power: 9, cooldown: 2, desc: "Es tajam yang menusuk." },
  shadowCut: { name: "Shadow Cut", icon: "./assets/skills/shadow-cut.svg", mpCost: 7, power: 12, cooldown: 3, desc: "Tebasan gelap yang cepat." },
  earthSpike: { name: "Earth Spike", icon: "./assets/skills/earth-spike.svg", mpCost: 9, power: 15, cooldown: 3, desc: "Paku tanah menghantam musuh." },
  meteor: { name: "Meteor", icon: "./assets/skills/meteor.svg", mpCost: 12, power: 20, cooldown: 4, desc: "Pukulan meteor dengan damage besar." },
};

export const ITEMS = {
  potion: { name: "Potion", kind: "heal_hp", amount: 25, desc: "Memulihkan 25 HP" },
  ether: { name: "Ether", kind: "heal_mp", amount: 10, desc: "Memulihkan 10 MP" },
  woodenSword: { name: "Wooden Sword", kind: "gear", slot: "hand", desc: "Senjata kayu sederhana.", atk: 2 },
  clothHat: { name: "Cloth Hat", kind: "gear", slot: "head", desc: "Topi kain lusuh.", def: 1 },
  leatherArmor: { name: "Leather Armor", kind: "gear", slot: "armor", desc: "Armor kulit ringan.", def: 2 },
  leatherPants: { name: "Leather Pants", kind: "gear", slot: "pant", desc: "Celana kulit sederhana.", def: 1 },
  oldBoots: { name: "Old Boots", kind: "gear", slot: "shoes", desc: "Sepatu tua tapi nyaman.", spd: 1 },
  bronzeSword: { name: "Bronze Sword", kind: "gear", slot: "hand", desc: "Pedang Lv3 dengan serangan stabil.", atk: 4 },
  ironSword: { name: "Iron Sword", kind: "gear", slot: "hand", desc: "Pedang Lv6 yang kokoh.", atk: 6 },
  runeBlade: { name: "Rune Blade", kind: "gear", slot: "hand", desc: "Pedang Lv9 dengan rune kuno.", atk: 9 },
  leatherHood: { name: "Leather Hood", kind: "gear", slot: "head", desc: "Pelindung kepala Lv2.", def: 2 },
  ironHelm: { name: "Iron Helm", kind: "gear", slot: "head", desc: "Helm Lv7 yang berat.", def: 4 },
  chainVest: { name: "Chain Vest", kind: "gear", slot: "armor", desc: "Armor Lv4 berbahan rantai.", def: 4 },
  steelArmor: { name: "Steel Armor", kind: "gear", slot: "armor", desc: "Armor Lv8 dengan pertahanan tinggi.", def: 7 },
  travelerPants: { name: "Traveler Pants", kind: "gear", slot: "pant", desc: "Celana Lv3 untuk perjalanan.", def: 2, spd: 1 },
  ironGreaves: { name: "Iron Greaves", kind: "gear", slot: "pant", desc: "Greaves Lv7 kokoh.", def: 4 },
  swiftBoots: { name: "Swift Boots", kind: "gear", slot: "shoes", desc: "Sepatu Lv5 meningkatkan kecepatan.", spd: 2 },
};

export const ENEMY_NAMES = ["Slime", "Goblin", "Bandit", "Wolf", "Skeleton"];

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

export const SHOP_GOODS = [
  { name: "Potion", price: 12, ref: ITEMS.potion },
  { name: "Ether", price: 18, ref: ITEMS.ether },
  { name: "Wooden Sword", price: 30, ref: ITEMS.woodenSword },
  { name: "Cloth Hat", price: 20, ref: ITEMS.clothHat },
  { name: "Leather Armor", price: 40, ref: ITEMS.leatherArmor },
  { name: "Leather Pants", price: 28, ref: ITEMS.leatherPants },
  { name: "Old Boots", price: 22, ref: ITEMS.oldBoots },
  { name: "Bronze Sword", price: 55, ref: ITEMS.bronzeSword },
  { name: "Iron Sword", price: 85, ref: ITEMS.ironSword },
  { name: "Rune Blade", price: 120, ref: ITEMS.runeBlade },
  { name: "Leather Hood", price: 35, ref: ITEMS.leatherHood },
  { name: "Iron Helm", price: 75, ref: ITEMS.ironHelm },
  { name: "Chain Vest", price: 60, ref: ITEMS.chainVest },
  { name: "Steel Armor", price: 120, ref: ITEMS.steelArmor },
  { name: "Traveler Pants", price: 40, ref: ITEMS.travelerPants },
  { name: "Iron Greaves", price: 105, ref: ITEMS.ironGreaves },
  { name: "Swift Boots", price: 95, ref: ITEMS.swiftBoots },
];

export const getShopItem = (name) => SHOP_GOODS.find((g) => g.name === name);
