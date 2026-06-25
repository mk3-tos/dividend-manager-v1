const STORAGE_KEY = "dividend-manager-stocks-v2";
const EXCLUDED_STORAGE_KEY = "dividend-manager-excluded-stocks-v1";
const WATCHLIST_STORAGE_KEY = "dividend-manager-watchlist-v1";
const CANDIDATE_STOCKS_STORAGE_KEY = "dividend-manager-candidate-stocks-v1";
const FUND_SEED_KEY = "dividend-manager-fund-seed-v1";
const US_ETF_SEED_KEY = "dividend-manager-us-etf-seed-v1";
const COLUMN_WIDTHS_KEY = "dividend-manager-column-widths-v6";
const DIVIDEND_GOAL_STORAGE_KEY = "dividend-manager-dividend-goal-v1";
const PORTFOLIO_SNAPSHOTS_STORAGE_KEY = "dividend-manager-portfolio-snapshots-v1";
const DEFAULT_COLUMN_WIDTHS = [38, 112, 58, 260, 170, 118, 108, 108, 118, 96, 84, 96, 104, 96, 92, 92, 118, 104, 118];
const DAILY_COLUMN_WIDTHS = {
  dailyDecliners: [58, 260, 96, 96, 92, 92, 84, 118],
  buyCandidates: [44, 58, 260, 84, 92, 108, 118, 108, 104, 260],
  watchlist: [58, 260, 96, 92, 92, 96, 96, 180],
};
const RESEARCH_LINKS = [
  { id: "irbank", label: "IRBANK", url: (code) => `https://irbank.net/search/${code}` },
  { id: "dividend-navi", label: "配当ナビ", url: (code) => `https://timetobuystocks.net/stocks/${code}` },
  { id: "kabutan", label: "株探", url: (code) => `https://kabutan.jp/stock/?code=${code}` },
  { id: "minkabu", label: "みんかぶ", url: (code) => `https://minkabu.jp/stock/${code}` },
  { id: "buffett", label: "バフェット", url: (code) => `https://www.buffett-code.com/company/${code}/stockprice` },
  { id: "yahoo", label: "Yahoo", url: (code) => `https://finance.yahoo.co.jp/quote/${code}` },
];
const HISTORY_LIMIT = 30;
const NAME_COLUMN_INDEX = 3;
const SECTOR_COLUMN_INDEX = 4;
const REPEATED_HEADER_INTERVAL = 15;

const storageService = {
  getItem(key) {
    return localStorage.getItem(key);
  },
  setItem(key, value) {
    localStorage.setItem(key, value);
  },
  loadJson(key, fallback = null) {
    const saved = this.getItem(key);
    if (!saved) return fallback;
    try {
      return JSON.parse(saved);
    } catch {
      return fallback;
    }
  },
  saveJson(key, value) {
    this.setItem(key, JSON.stringify(value));
  },
  loadStocks() {
    return this.loadJson(STORAGE_KEY, null);
  },
  saveStocks(nextStocks) {
    this.saveJson(STORAGE_KEY, nextStocks);
  },
  loadExcludedStocks() {
    return this.loadJson(EXCLUDED_STORAGE_KEY, null);
  },
  saveExcludedStocks(nextExcludedStocks) {
    this.saveJson(EXCLUDED_STORAGE_KEY, nextExcludedStocks);
  },
  loadWatchlist() {
    const watchlistRows = this.loadJson(WATCHLIST_STORAGE_KEY, null);
    if (Array.isArray(watchlistRows)) return watchlistRows;
    return this.loadJson(CANDIDATE_STOCKS_STORAGE_KEY, []);
  },
  saveWatchlist(nextWatchlist) {
    this.saveJson(WATCHLIST_STORAGE_KEY, nextWatchlist);
    this.saveJson(CANDIDATE_STOCKS_STORAGE_KEY, nextWatchlist);
  },
  loadDividendGoal() {
    return this.loadJson(DIVIDEND_GOAL_STORAGE_KEY, null);
  },
  saveDividendGoal(goal) {
    this.saveJson(DIVIDEND_GOAL_STORAGE_KEY, goal);
  },
  loadPortfolioSnapshots() {
    return this.loadJson(PORTFOLIO_SNAPSHOTS_STORAGE_KEY, []);
  },
  savePortfolioSnapshots(snapshots) {
    this.saveJson(PORTFOLIO_SNAPSHOTS_STORAGE_KEY, snapshots);
  },
  loadUiSettings() {
    return this.loadJson(COLUMN_WIDTHS_KEY, {});
  },
  saveUiSettings(settings) {
    this.saveJson(COLUMN_WIDTHS_KEY, settings);
  },
  isSeedDone(seedKey) {
    return this.getItem(seedKey) === "done";
  },
  markSeedDone(seedKey) {
    this.setItem(seedKey, "done");
  },
};

const initialStocks = [
  { code: "1605", name: "INPEX", sector: "鉱業", current: 3559, buy: 1869, qty: 9, dividend: 108 },
  { code: "1925", name: "大和ハウス工業", sector: "建設業", current: 4316, buy: 4779, qty: 8, dividend: 176 },
  { code: "1928", name: "積水ハウス", sector: "建設業", current: 3292, buy: 3150, qty: 11, dividend: 145 },
  { code: "2002", name: "日清製粉グループ本社", sector: "食料品", current: 1967.5, buy: 1716, qty: 4, dividend: 65 },
  { code: "2269", name: "明治ホールディングス", sector: "食料品", current: 3718, buy: 3052, qty: 10, dividend: 110 },
  { code: "2502", name: "アサヒグループHD", sector: "食料品", current: 1499, buy: 1680, qty: 18, dividend: 52 },
  { code: "2503", name: "キリンHD", sector: "食料品", current: 2715, buy: 2047, qty: 8, dividend: 76 },
  { code: "2801", name: "キッコーマン", sector: "食料品", current: 1619, buy: 1324, qty: 13, dividend: 25 },
  { code: "2871", name: "ニチレイ", sector: "食料品", current: 2137, buy: 1738, qty: 5, dividend: 50 },
  { code: "2914", name: "JT", sector: "食料品", current: 6197, buy: 3767, qty: 1, dividend: 242 },
  { code: "3003", name: "ヒューリック", sector: "不動産業", current: 1734, buy: 1449, qty: 5, dividend: 67 },
  { code: "3861", name: "王子ホールディングス", sector: "パルプ・紙", current: 789, buy: 839, qty: 19, dividend: 36 },
  { code: "4452", name: "花王", sector: "化学", current: 6026, buy: 6210, qty: 5, dividend: 156 },
  { code: "4502", name: "武田薬品工業", sector: "医薬品", current: 5061, buy: 4127, qty: 5, dividend: 204 },
  { code: "4503", name: "アステラス製薬", sector: "医薬品", current: 2139.5, buy: 1530, qty: 3, dividend: 80 },
  { code: "4528", name: "小野薬品工業", sector: "医薬品", current: 2201.5, buy: 1559, qty: 7, dividend: 80 },
  { code: "4919", name: "ミルボン", sector: "化学", current: 2729, buy: 2449, qty: 6, dividend: 88 },
  { code: "5105", name: "TOYO TIRE", sector: "ゴム製品", current: 3714, buy: 3225, qty: 2, dividend: 135 },
  { code: "5108", name: "ブリヂストン", sector: "ゴム製品", current: 3399, buy: 2924, qty: 10, dividend: 125 },
  { code: "6141", name: "DMG森精機", sector: "機械", current: 3386, buy: 2675, qty: 9, dividend: 105 },
  { code: "6301", name: "コマツ", sector: "機械", current: 6532, buy: 4279, qty: 4, dividend: 190 },
  { code: "6326", name: "クボタ", sector: "機械", current: 2721.5, buy: 1615, qty: 10, dividend: 52 },
  { code: "6902", name: "デンソー", sector: "輸送用機器", current: 1857.5, buy: 1818, qty: 1, dividend: 74 },
  { code: "6981", name: "村田製作所", sector: "電気機器", current: 8737, buy: 2004, qty: 8, dividend: 70 },
  { code: "7182", name: "ゆうちょ銀行", sector: "銀行業", current: 3215, buy: 1508, qty: 2, dividend: 93 },
  { code: "7203", name: "トヨタ自動車", sector: "輸送用機器", current: 2778, buy: 2580, qty: 13, dividend: 100 },
  { code: "7272", name: "ヤマハ発動機", sector: "輸送用機器", current: 1189, buy: 1084, qty: 7, dividend: 50 },
  { code: "8001", name: "伊藤忠商事", sector: "卸売業", current: 1882, buy: 1411, qty: 11, dividend: 44 },
  { code: "8113", name: "ユニ・チャーム", sector: "化学", current: 914.3, buy: 989, qty: 27, dividend: 22 },
  { code: "8306", name: "三菱UFJ FG", sector: "銀行業", current: 3156, buy: 1887, qty: 8, dividend: 96 },
  { code: "8591", name: "オリックス", sector: "その他金融業", current: 6087, buy: 2946, qty: 5, dividend: 187.36 },
  { code: "8766", name: "東京海上HD", sector: "保険業", current: 7349, buy: 5375, qty: 5, dividend: 245 },
  { code: "9021", name: "JR西日本", sector: "陸運業", current: 2576.5, buy: 2609, qty: 1, dividend: 97.5 },
  { code: "9432", name: "NTT", sector: "情報・通信", current: 148.3, buy: 149, qty: 200, dividend: 5.4 },
  { code: "9433", name: "KDDI", sector: "情報・通信", current: 2764.5, buy: 2408, qty: 15, dividend: 84 },
  { code: "9513", name: "J-POWER", sector: "電気・ガス業", current: 4048, buy: 2402, qty: 8, dividend: 105 },
];
const initialExcludedStocks = [
  { code: "1488", name: "iFreeETF 東証REIT指数", sector: "ETF", current: 1855, buy: 1909, qty: 19, dividend: null, type: "ETF" },
  { code: "1489", name: "NF 日経高配当50 ETF", sector: "ETF", current: 3193, buy: 2301, qty: 18, dividend: null, type: "ETF" },
  { code: "4063", name: "信越化学工業", sector: "化学", current: 7146, buy: 3994, qty: 2, dividend: null, type: "配当未入力" },
];
let excludedStocks = loadExcludedStocks();
const fundSeedStocks = [
  {
    assetClass: "投資信託",
    code: "FUND-G01",
    name: "eMAXIS Slim 全世界株式（除く日本）",
    sector: "全世界株式 / 成長投資枠",
    current: 37076,
    buy: 26048,
    qty: 140799,
    costAmount: 366753,
    marketValue: 522026,
    gainLossAmount: 155273,
    dividendStatus: "無分配",
    dividend: null,
  },
  {
    assetClass: "投資信託",
    code: "FUND-G02",
    name: "eMAXIS Slim 国内債券インデックス",
    sector: "国内債券 / 成長投資枠",
    current: 8529,
    buy: 9436,
    qty: 27791,
    costAmount: 26223,
    marketValue: 23702,
    gainLossAmount: -2521,
    dividendStatus: "無分配",
    dividend: null,
  },
  {
    assetClass: "投資信託",
    code: "FUND-G03",
    name: "eMAXIS Slim 先進国債券インデックス（除く日本）",
    sector: "先進国債券 / 成長投資枠",
    current: 15608,
    buy: 13855,
    qty: 3609,
    costAmount: 5000,
    marketValue: 5632,
    gainLossAmount: 632,
    dividendStatus: "無分配",
    dividend: null,
  },
  {
    assetClass: "投資信託",
    code: "FUND-G04",
    name: "ニッセイ外国株式インデックスファンド",
    sector: "外国株式 / 成長投資枠",
    current: 57641,
    buy: 41362,
    qty: 8706,
    costAmount: 36009,
    marketValue: 50182,
    gainLossAmount: 14173,
    dividendStatus: "無分配",
    dividend: null,
  },
  {
    assetClass: "投資信託",
    code: "FUND-G05",
    name: "SBI・V・S&P500インデックス・ファンド",
    sector: "米国株式 / 成長投資枠",
    current: 39190,
    buy: 28299,
    qty: 63996,
    costAmount: 181102,
    marketValue: 250800,
    gainLossAmount: 69698,
    dividendStatus: "無分配",
    dividend: null,
  },
  {
    assetClass: "投資信託",
    code: "FUND-T01",
    name: "eMAXIS Slim 全世界株式（オール・カントリー）",
    sector: "全世界株式 / つみたて投資枠",
    current: 36714,
    buy: 27403,
    qty: 9853,
    costAmount: 27000,
    marketValue: 36174,
    gainLossAmount: 9174,
    dividendStatus: "無分配",
    dividend: null,
  },
  {
    assetClass: "投資信託",
    code: "FUND-T02",
    name: "eMAXIS Slim 全世界株式（除く日本）",
    sector: "全世界株式 / つみたて投資枠",
    current: 37076,
    buy: 30674,
    qty: 34232,
    costAmount: 105003,
    marketValue: 126918,
    gainLossAmount: 21915,
    dividendStatus: "無分配",
    dividend: null,
  },
  {
    assetClass: "投資信託",
    code: "FUND-T03",
    name: "SBI・V・S&P500インデックス・ファンド",
    sector: "米国株式 / つみたて投資枠",
    current: 39190,
    buy: 32164,
    qty: 18033,
    costAmount: 58001,
    marketValue: 70671,
    gainLossAmount: 12670,
    dividendStatus: "無分配",
    dividend: null,
  },
];
const usEtfSeedStocks = [
  {
    assetClass: "米国ETF",
    code: "VYM",
    name: "バンガード 米国高配当株式ETF",
    sector: "米国高配当ETF",
    currency: "USD",
    current: 159.05,
    buy: 130.85,
    qty: 1,
    marketValue: 25495,
    costAmount: 20978,
    gainLossAmount: 4517,
    dividendStatus: "未入力",
    dividend: null,
  },
];
let importRows = [];

let stocks = loadStocks();
let watchlist = loadWatchlist();
let dividendGoal = loadDividendGoal();
let sortState = { field: "currentValue", direction: "desc" };
let excludedSortState = { field: "code", direction: "asc" };
let dailyDeclinersSortState = { field: "dayChangePct", direction: "asc" };
let buyCandidateSortState = { field: "buyCandidateScore", direction: "desc" };
let watchlistSortState = { field: "code", direction: "asc" };
let currentViewMode = "assets";
let currentSnapshotRange = "1m";
let undoStack = [];
let redoStack = [];
let suppressSortClickUntil = 0;
let suppressNextSortClick = false;
let selectedMainRowKey = "";
let selectedExcludedRowKey = "";
let selectedDailyDeclinerRowKey = "";
let selectedBuyCandidateRowKey = "";
let selectedWatchlistRowKey = "";

const yen = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const yenDecimal = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 });
const numberDecimal = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 });
const collator = new Intl.Collator("ja-JP", { numeric: true, sensitivity: "base" });
const sectorColors = [
  "#78b9d3",
  "#c9eadf",
  "#c9c4ef",
  "#f5d8c8",
  "#f3e6a7",
  "#a7d6c9",
  "#b5c9e8",
  "#e9bfd0",
  "#d8e2b3",
  "#9fd2e0",
  "#d2c6ea",
  "#f0ccb8",
];
const sectorTypeMap = {
  "サービス業": "ディフェンシブ",
  "その他製品": "ディフェンシブ",
  "医薬品": "ディフェンシブ",
  "金属製品": "ディフェンシブ",
  "小売業": "ディフェンシブ",
  "情報・通信": "ディフェンシブ",
  "食料品": "ディフェンシブ",
  "倉庫・運輸関連業": "ディフェンシブ",
  "電気・ガス業": "ディフェンシブ",
  "不動産業": "ディフェンシブ",
  "保険業": "ディフェンシブ",
  "水産・農林業": "ディフェンシブ",
  "パルプ・紙": "ディフェンシブ",
  "陸運業": "ディフェンシブ",
  "ガラス・土石製品": "景気敏感",
  "ゴム製品": "景気敏感",
  "その他金融業": "景気敏感",
  "卸売業": "景気敏感",
  "化学": "景気敏感",
  "機械": "景気敏感",
  "銀行業": "景気敏感",
  "建設業": "景気敏感",
  "鉱業": "景気敏感",
  "繊維製品": "景気敏感",
  "電気機器": "景気敏感",
  "石油・石炭製品": "景気敏感",
  "鉄鋼": "景気敏感",
  "非鉄金属": "景気敏感",
  "輸送用機器": "景気敏感",
  "精密機器": "景気敏感",
  "海運業": "景気敏感",
  "空運業": "景気敏感",
  "証券業": "景気敏感",
};
const typeColors = {
  "ディフェンシブ": "#9edfcf",
  "景気敏感": "#f1b3be",
  ETF: "#c9c4ef",
  "未分類": "#c9c4ef",
};
const assetColors = {
  "日本株": "#78b9d3",
  "米国ETF": "#9edfcf",
  "投資信託": "#c9c4ef",
  ETF: "#f3e6a7",
  "その他": "#d8e2b3",
};
const dividendStatusColors = {
  "配当あり": "#78b9d3",
  "無分配": "#c9eadf",
  "未入力": "#f3e6a7",
  "参考": "#f1b3be",
};
const viewModes = {
  assets: {
    title: "総資産",
    description: "日本株、外国株、投資信託をまとめて確認します。",
    badge: "全資産",
    assetClass: "all",
    dividendStatus: "all",
    showDividendInsights: true,
    sort: { field: "currentValue", direction: "desc" },
  },
  dividends: {
    title: "日本株",
    description: "日本株とETFのうち、配当ありと未入力の銘柄をまとめて確認します。",
    badge: "日本株",
    assetClass: "all",
    dividendStatus: "集計対象",
    showDividendInsights: true,
    sort: { field: "currentValue", direction: "desc" },
  },
  usEtf: {
    title: "外国株",
    description: "外国株の円換算評価額、取得額、分配金の入力状況を確認します。",
    badge: "外国株",
    assetClass: "米国ETF",
    dividendStatus: "all",
    showDividendInsights: true,
    sort: { field: "currentValue", direction: "desc" },
  },
  funds: {
    title: "投資信託",
    description: "配当よりも評価額、取得額、損益を中心に確認します。",
    badge: "投資信託",
    assetClass: "投資信託",
    dividendStatus: "all",
    showDividendInsights: false,
    sort: { field: "currentValue", direction: "desc" },
  },
};

function loadStocks() {
  const saved = storageService.loadStocks();
  if (!saved) return structuredClone([...initialStocks, ...fundSeedStocks, ...usEtfSeedStocks]);
  if (!Array.isArray(saved)) return structuredClone([...initialStocks, ...fundSeedStocks, ...usEtfSeedStocks]);
  return mergeSeedStocks(saved);
}

function loadExcludedStocks() {
  const saved = storageService.loadExcludedStocks();
  if (!saved) return structuredClone(initialExcludedStocks);
  return Array.isArray(saved) ? saved : structuredClone(initialExcludedStocks);
}

function loadWatchlist() {
  const saved = storageService.loadWatchlist();
  return Array.isArray(saved) ? saved : [];
}

function loadDividendGoal() {
  const defaults = { monthlyDividend: null, stockCount: null, dividendYield: 3.5, marketValueTarget: 10000 };
  const saved = storageService.loadDividendGoal();
  if (!saved) return defaults;
  try {
    return {
      monthlyDividend: toNumber(saved.monthlyDividend),
      stockCount: toNumber(saved.stockCount),
      dividendYield: toNumber(saved.dividendYield) ?? defaults.dividendYield,
      marketValueTarget: toNumber(saved.marketValueTarget) ?? defaults.marketValueTarget,
    };
  } catch {
    return defaults;
  }
}

function mergeSeedStocks(savedStocks) {
  let merged = savedStocks;
  merged = mergeSeedGroup(merged, fundSeedStocks, FUND_SEED_KEY);
  merged = mergeSeedGroup(merged, usEtfSeedStocks, US_ETF_SEED_KEY);
  return merged;
}

function mergeSeedGroup(savedStocks, seedStocks, seedKey) {
  if (storageService.isSeedDone(seedKey)) return savedStocks;

  const existingCodes = new Set(savedStocks.map((stock) => String(stock.code)));
  const missingStocks = seedStocks.filter((stock) => !existingCodes.has(String(stock.code)));
  if (missingStocks.length === 0) {
    storageService.markSeedDone(seedKey);
    return savedStocks;
  }

  const merged = [...savedStocks, ...structuredClone(missingStocks)];
  saveStocks(merged);
  storageService.markSeedDone(seedKey);
  return merged;
}

function saveStocks(nextStocks = stocks) {
  storageService.saveStocks(nextStocks);
}

function saveExcludedStocks(nextExcludedStocks = excludedStocks) {
  storageService.saveExcludedStocks(nextExcludedStocks);
}

function saveWatchlist(nextWatchlist = watchlist) {
  storageService.saveWatchlist(nextWatchlist);
}

function saveDividendGoal(goal = dividendGoal) {
  storageService.saveDividendGoal(goal);
}

function loadUiSettings() {
  return storageService.loadUiSettings();
}

function saveUiSettings(settings) {
  storageService.saveUiSettings(settings);
}

function createHistorySnapshot() {
  return {
    stocks: structuredClone(stocks),
    excludedStocks: structuredClone(excludedStocks),
    watchlist: structuredClone(watchlist),
    portfolioSnapshots: structuredClone(storageService.loadPortfolioSnapshots() ?? []),
  };
}

function restoreHistorySnapshot(snapshot) {
  stocks = structuredClone(snapshot.stocks);
  excludedStocks = structuredClone(snapshot.excludedStocks);
  watchlist = structuredClone(snapshot.watchlist ?? []);
  saveStocks();
  saveExcludedStocks();
  saveWatchlist();
  storageService.savePortfolioSnapshots(structuredClone(snapshot.portfolioSnapshots ?? []));
  render();
}

function rememberState() {
  undoStack.push(createHistorySnapshot());
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function undoDataChange() {
  if (undoStack.length === 0) return;
  redoStack.push(createHistorySnapshot());
  restoreHistorySnapshot(undoStack.pop());
  updateHistoryButtons();
}

function redoDataChange() {
  if (redoStack.length === 0) return;
  undoStack.push(createHistorySnapshot());
  restoreHistorySnapshot(redoStack.pop());
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const undoButton = document.querySelector("#undoButton");
  const redoButton = document.querySelector("#redoButton");
  if (undoButton) undoButton.disabled = undoStack.length === 0;
  if (redoButton) redoButton.disabled = redoStack.length === 0;
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(String(value).replaceAll(",", "").replace("%", ""));
  return Number.isFinite(number) ? number : null;
}

function formatYenPrecise(value) {
  if (!Number.isFinite(value)) return "-";
  return `${yenDecimal.format(value)}円`;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "-";
  return numberDecimal.format(value);
}

function formatSignedNumber(value) {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "±0";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${yenDecimal.format(Math.abs(value))}`;
}

function formatSignedYen(value) {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "±0円";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${yenDecimal.format(Math.abs(value))}円`;
}

function formatSignedPercent(value) {
  if (!Number.isFinite(value)) return "-";
  if (value === 0) return "±0.00%";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(2)}%`;
}

function numberToneClass(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return "";
  if (number < 0) return "is-negative";
  return "";
}

function dayChangeToneClass(value) {
  const number = toNumber(value);
  if (!Number.isFinite(number)) return "";
  if (number < 0) return "is-negative";
  if (number > 0) return "is-positive";
  return "";
}

function getYieldAdvantageLevel(stock) {
  if (!Number.isFinite(stock.yieldOnCost) || !Number.isFinite(stock.currentYield)) return "";
  const spread = stock.yieldOnCost - stock.currentYield;
  if (spread > 2) return "best";
  if (spread > 1) return "great";
  if (spread > 0) return "good";
  return "";
}

function yieldAdvantageClass(stock) {
  const level = getYieldAdvantageLevel(stock);
  return level ? `is-yield-advantage is-yield-${level}` : "";
}

function getYieldAdvantageTheme(level) {
  if (level === "good") return { label: "GOOD", color: "#f3e6a7" };
  if (level === "great") return { label: "GREAT", color: "#9edfcf" };
  if (level === "best") return { label: "BEST", color: "#f1b3be" };
  return null;
}

function yieldAdvantageTitle(stock) {
  const level = getYieldAdvantageLevel(stock);
  if (level === "best") return "BEST: 取得利回りが配当利回りを2%超上回っています";
  if (level === "great") return "GREAT: 取得利回りが配当利回りを1%超から2%まで上回っています";
  if (level === "good") return "GOOD: 取得利回りが配当利回りを1%まで上回っています";
  return "";
}

function applyYieldAdvantageTheme(cell, stock) {
  const level = getYieldAdvantageLevel(stock);
  const theme = getYieldAdvantageTheme(level);
  cell.classList.remove("is-yield-advantage", "is-yield-good", "is-yield-great", "is-yield-best");
  cell.removeAttribute("data-yield-label");
  cell.style.removeProperty("--yield-color");
  if (!theme) {
    cell.removeAttribute("title");
    return;
  }
  cell.classList.add("is-yield-advantage", `is-yield-${level}`);
  cell.dataset.yieldLabel = theme.label;
  cell.style.setProperty("--yield-color", theme.color);
  cell.title = yieldAdvantageTitle(stock);
}

function yieldAdvantageCellAttrs(stock) {
  const level = getYieldAdvantageLevel(stock);
  const theme = getYieldAdvantageTheme(level);
  if (!theme) return "";
  return ` class="${yieldAdvantageClass(stock)}" data-yield-label="${theme.label}" style="--yield-color:${theme.color};" title="${yieldAdvantageTitle(stock)}"`;
}

function applyTone(element, value) {
  element.classList.toggle("is-negative", Number.isFinite(value) && value < 0);
  element.classList.toggle("is-positive", Number.isFinite(value) && value > 0);
}

function enrich(stock, index) {
  const current = toNumber(stock.current);
  const buy = toNumber(stock.buy);
  const qty = toNumber(stock.qty);
  const dividend = toNumber(stock.dividend);
  const dayChange = toNumber(stock.dayChange);
  const dayChangePct = toNumber(stock.dayChangePct);
  const explicitCurrentYield = toNumber(stock.currentYield ?? stock.dividendYield);
  const assetClass = normalizeAssetClass(stock);
  const dividendStatus = normalizeDividendStatus(stock, assetClass, dividend);
  const isDividendIncluded = dividendStatus === "集計対象";
  const annualDividend = !isDividendIncluded || dividend === null || qty === null ? null : dividend * qty;
  const explicitMarketValue = toNumber(stock.marketValue);
  const explicitCostValue = toNumber(stock.costAmount);
  const explicitGainLoss = toNumber(stock.gainLossAmount);
  const currentValue = explicitMarketValue !== null ? explicitMarketValue : current === null || qty === null ? null : current * qty;
  const costValue = explicitCostValue !== null ? explicitCostValue : buy === null || qty === null ? null : buy * qty;
  const gainLoss = explicitGainLoss !== null ? explicitGainLoss : currentValue === null || costValue === null ? null : currentValue - costValue;
  const gainLossPct = gainLoss === null || costValue === null || costValue === 0 ? null : (gainLoss / costValue) * 100;

  return {
    ...stock,
    _index: index,
    assetClass,
    dividendStatus,
    current,
    buy,
    qty,
    dividend,
    dayChange,
    dayChangePct,
    annualDividend,
    currentValue,
    costValue,
    gainLoss,
    gainLossPct,
    currentYield:
      explicitCurrentYield !== null
        ? explicitCurrentYield
        : !isDividendIncluded || dividend === null || current === null || current === 0
          ? null
          : (dividend / current) * 100,
    yieldOnCost: !isDividendIncluded || dividend === null || buy === null || buy === 0 ? null : (dividend / buy) * 100,
  };
}

function normalizeAssetClass(stock) {
  if (stock.assetClass) return stock.assetClass;
  if (stock.type === "ETF" || stock.sector === "ETF") return "ETF";
  return "日本株";
}

function normalizeDividendStatus(stock, assetClass, dividend) {
  if (stock.dividendStatus) return normalizeDividendStatusValue(stock.dividendStatus);
  if (stock.type === "ETF" || assetClass === "ETF") return "未入力";
  if (assetClass === "投資信託") return "無分配";
  return dividend === null ? "未入力" : "集計対象";
}

function normalizeDividendStatusValue(value) {
  if (value === "配当あり") return "集計対象";
  if (value === "対象外") return "未入力";
  return value || "未入力";
}

function displayDividendStatus(status) {
  if (status === "集計対象") return "配当あり";
  if (status === "対象外") return "未入力";
  return status || "未入力";
}

function normalizeHolding(rawStock) {
  const rawAssetClass = normalizeAssetClass(rawStock);
  const assetClass = normalizeHoldingAssetClass(rawAssetClass, rawStock);
  const dividendStatus = normalizeHoldingDividendStatus(
    normalizeDividendStatus(rawStock, rawAssetClass, toNumber(rawStock.dividend)),
  );
  const { fundCategory, nisaType } = splitFundSector(rawStock.sector, assetClass);
  const market = assetClass === "us_etf" ? "US" : "JP";
  const currency = rawStock.currency || (assetClass === "us_etf" ? "USD" : "JPY");
  const code = rawStock.code ? String(rawStock.code) : "";

  return {
    id: createHoldingId({ code, assetClass, nisaType }),
    code,
    name: rawStock.name || code,
    assetClass,
    market,
    currency,
    sector: rawStock.sector || null,
    fundCategory,
    nisaType,
    quantity: toNumber(rawStock.qty),
    averageCost: toNumber(rawStock.buy),
    currentPrice: toNumber(rawStock.current),
    marketValue: toNumber(rawStock.marketValue),
    costAmount: toNumber(rawStock.costAmount),
    gainLossAmount: toNumber(rawStock.gainLossAmount),
    dayChange: toNumber(rawStock.dayChange),
    dayChangePct: toNumber(rawStock.dayChangePct),
    dividendPerShare: toNumber(rawStock.dividend),
    dividendStatus,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeHoldings(rawStocks) {
  return (rawStocks || []).map((rawStock) => normalizeHolding(rawStock));
}

function normalizeHoldingAssetClass(rawAssetClass, rawStock = {}) {
  const jpStock = "\u65e5\u672c\u682a";
  const jpEtf = "ETF";
  const usEtf = "\u7c73\u56fdETF";
  const fund = "\u6295\u8cc7\u4fe1\u8a17";
  const other = "\u305d\u306e\u4ed6";

  if (rawAssetClass === "jp_stock") return "jp_stock";
  if (rawAssetClass === "jp_etf") return "jp_etf";
  if (rawAssetClass === "us_etf") return "us_etf";
  if (rawAssetClass === "fund") return "fund";
  if (rawAssetClass === jpStock) return "jp_stock";
  if (rawAssetClass === jpEtf || rawStock.type === jpEtf || rawStock.sector === jpEtf) return "jp_etf";
  if (rawAssetClass === usEtf) return "us_etf";
  if (rawAssetClass === fund) return "fund";
  if (rawAssetClass === other) return "other";
  return "other";
}

function normalizeHoldingDividendStatus(rawStatus) {
  const included = "\u96c6\u8a08\u5bfe\u8c61";
  const missing = "\u672a\u5165\u529b";
  const none = "\u7121\u5206\u914d";
  const reference = "\u53c2\u8003";
  const includedDisplay = "\u914d\u5f53\u3042\u308a";
  const excludedDisplay = "\u5bfe\u8c61\u5916";

  if (rawStatus === "included") return "included";
  if (rawStatus === "missing") return "missing";
  if (rawStatus === "none") return "none";
  if (rawStatus === "reference") return "reference";
  if (rawStatus === included || rawStatus === includedDisplay) return "included";
  if (rawStatus === missing || rawStatus === excludedDisplay) return "missing";
  if (rawStatus === none) return "none";
  if (rawStatus === reference) return "reference";
  return "missing";
}

function splitFundSector(sector, assetClass) {
  const growth = "\u6210\u9577\u6295\u8cc7\u67a0";
  const tsumitate = "\u3064\u307f\u305f\u3066\u6295\u8cc7\u67a0";
  const text = String(sector || "");
  const [categoryPart, nisaPart] = text.split("/").map((part) => part.trim());
  let nisaType = "unknown";

  if (nisaPart?.includes(growth)) nisaType = "growth";
  else if (nisaPart?.includes(tsumitate)) nisaType = "tsumitate";
  else if (nisaPart?.toUpperCase().includes("NISA")) nisaType = "nisa";

  return {
    fundCategory: assetClass === "fund" ? categoryPart || null : null,
    nisaType,
  };
}

function createHoldingId({ code, assetClass, nisaType }) {
  const safeCode = String(code || "unknown").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return [assetClass || "other", safeCode || "unknown", nisaType || "unknown"].join(":");
}

function previewNormalizedHoldings(rawStocks = stocks) {
  const normalized = normalizeHoldings(rawStocks);
  console.table(normalized);
  return normalized;
}

function createPortfolioSnapshot(rawStocks = stocks, snapshotDate = formatSnapshotDate(new Date())) {
  const normalized = normalizeHoldings(rawStocks);
  const updatedAt = new Date().toISOString();
  const totals = normalized.reduce(
    (summary, holding) => {
      const marketValue = getHoldingMarketValue(holding);
      const annualDividend = getHoldingAnnualDividend(holding);

      summary.totalMarketValue += marketValue;
      summary.annualDividend += annualDividend;
      summary.assetCount += 1;

      if (holding.assetClass === "jp_stock" || holding.assetClass === "jp_etf") {
        summary.jpStockMarketValue += marketValue;
      } else if (holding.assetClass === "us_etf") {
        summary.usEtfMarketValue += marketValue;
      } else if (holding.assetClass === "fund") {
        summary.fundMarketValue += marketValue;
      } else {
        summary.otherMarketValue += marketValue;
      }

      return summary;
    },
    {
      totalMarketValue: 0,
      jpStockMarketValue: 0,
      usEtfMarketValue: 0,
      fundMarketValue: 0,
      otherMarketValue: 0,
      annualDividend: 0,
      assetCount: 0,
    },
  );

  return {
    snapshotDate,
    totalMarketValue: roundSnapshotNumber(totals.totalMarketValue),
    jpStockMarketValue: roundSnapshotNumber(totals.jpStockMarketValue),
    usEtfMarketValue: roundSnapshotNumber(totals.usEtfMarketValue),
    fundMarketValue: roundSnapshotNumber(totals.fundMarketValue),
    otherMarketValue: roundSnapshotNumber(totals.otherMarketValue),
    annualDividend: roundSnapshotNumber(totals.annualDividend),
    monthlyDividend: roundSnapshotNumber(totals.annualDividend / 12),
    assetCount: totals.assetCount,
    updatedAt,
  };
}

function savePortfolioSnapshot(snapshot = createPortfolioSnapshot(stocks)) {
  const snapshots = storageService.loadPortfolioSnapshots();
  const nextSnapshots = Array.isArray(snapshots)
    ? snapshots.filter((item) => item.snapshotDate !== snapshot.snapshotDate)
    : [];
  nextSnapshots.push(snapshot);
  nextSnapshots.sort((a, b) => String(a.snapshotDate).localeCompare(String(b.snapshotDate)));
  storageService.savePortfolioSnapshots(nextSnapshots);
  return snapshot;
}

function saveTodayPortfolioSnapshot() {
  const snapshot = savePortfolioSnapshot(createPortfolioSnapshot(stocks));
  const message = `Snapshot saved: ${snapshot.snapshotDate} / ${formatYenPrecise(snapshot.totalMarketValue)}`;
  console.info(message, snapshot);
  renderPortfolioSnapshotChart();
  alert("\u4eca\u65e5\u306e\u8cc7\u7523\u72b6\u6cc1\u3092\u8a18\u9332\u3057\u307e\u3057\u305f\u3002");
  return snapshot;
}

function saveYesterdayTestPortfolioSnapshot() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const todaySnapshot = createPortfolioSnapshot(stocks);
  const scaledSnapshot = {
    ...todaySnapshot,
    snapshotDate: formatSnapshotDate(yesterday),
    totalMarketValue: roundSnapshotNumber(todaySnapshot.totalMarketValue * 0.95),
    jpStockMarketValue: roundSnapshotNumber(todaySnapshot.jpStockMarketValue * 0.95),
    usEtfMarketValue: roundSnapshotNumber(todaySnapshot.usEtfMarketValue * 0.95),
    fundMarketValue: roundSnapshotNumber(todaySnapshot.fundMarketValue * 0.95),
    otherMarketValue: roundSnapshotNumber(todaySnapshot.otherMarketValue * 0.95),
    annualDividend: roundSnapshotNumber(todaySnapshot.annualDividend * 0.95),
    monthlyDividend: roundSnapshotNumber(todaySnapshot.monthlyDividend * 0.95),
  };
  const snapshot = savePortfolioSnapshot(scaledSnapshot);
  const message = `Test snapshot saved: ${snapshot.snapshotDate} / ${formatYenPrecise(snapshot.totalMarketValue)}`;
  console.info(message, snapshot);
  renderPortfolioSnapshotChart();
  alert("\u6628\u65E5\u306E\u30C6\u30B9\u30C8\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F\u3002");
  return snapshot;
}

function getHoldingMarketValue(holding) {
  if (Number.isFinite(holding.marketValue)) return holding.marketValue;
  if (Number.isFinite(holding.currentPrice) && Number.isFinite(holding.quantity)) {
    return holding.currentPrice * holding.quantity;
  }
  return 0;
}

function getHoldingAnnualDividend(holding) {
  if (holding.dividendStatus !== "included") return 0;
  if (!Number.isFinite(holding.dividendPerShare) || !Number.isFinite(holding.quantity)) return 0;
  return holding.dividendPerShare * holding.quantity;
}

function formatSnapshotDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseSnapshotDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function diffDays(fromDate, toDate) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((toDate.getTime() - fromDate.getTime()) / oneDay);
}

function shiftDateByRange(date, rangeKey) {
  const next = new Date(date);
  if (rangeKey === "1m") next.setMonth(next.getMonth() - 1);
  else if (rangeKey === "3m") next.setMonth(next.getMonth() - 3);
  else if (rangeKey === "6m") next.setMonth(next.getMonth() - 6);
  else if (rangeKey === "1y") next.setFullYear(next.getFullYear() - 1);
  else if (rangeKey === "3y") next.setFullYear(next.getFullYear() - 3);
  else if (rangeKey === "5y") next.setFullYear(next.getFullYear() - 5);
  return next;
}

function filterSnapshotsByCurrentRange(snapshots) {
  if (currentSnapshotRange === "all" || snapshots.length === 0) return snapshots;
  const lastDate = parseSnapshotDate(snapshots[snapshots.length - 1]?.snapshotDate);
  if (!lastDate) return snapshots;
  const rangeStart = shiftDateByRange(lastDate, currentSnapshotRange);
  return snapshots.filter((snapshot) => {
    const snapshotDate = parseSnapshotDate(snapshot.snapshotDate);
    return snapshotDate ? snapshotDate >= rangeStart : true;
  });
}

function updateSnapshotRangeButtons() {
  document.querySelectorAll(".trend-range-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.range === currentSnapshotRange);
  });
}

function roundSnapshotNumber(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
}

function renderPortfolioSnapshotAuditTable(snapshots) {
  const tableBody = document.querySelector("#snapshotAuditTable");
  if (!tableBody) return;

  const rows = [...snapshots].sort((a, b) => String(b.snapshotDate).localeCompare(String(a.snapshotDate)));
  if (rows.length === 0) {
    tableBody.innerHTML = `<tr><td class="snapshot-audit-empty" colspan="6">\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093</td></tr>`;
    return;
  }

  tableBody.innerHTML = rows
    .map(
      (snapshot) => `
        <tr>
          <td>${snapshot.snapshotDate ?? "-"}</td>
          <td>${formatYenPrecise(snapshot.totalMarketValue)}</td>
          <td>${formatYenPrecise(snapshot.jpStockMarketValue)}</td>
          <td>${formatYenPrecise(snapshot.usEtfMarketValue)}</td>
          <td>${formatYenPrecise(snapshot.fundMarketValue)}</td>
          <td>${formatYenPrecise(snapshot.annualDividend)}</td>
        </tr>`,
    )
    .join("");
}

function renderDividendTrendSummary(snapshots) {
  const currentValueElement = document.querySelector("#dividendTrendCurrentValue");
  const deltaValueElement = document.querySelector("#dividendTrendDeltaValue");
  const deltaPctElement = document.querySelector("#dividendTrendDeltaPct");
  if (!currentValueElement || !deltaValueElement || !deltaPctElement) return;

  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const currentValue = latest?.annualDividend ?? null;
  const deltaValue =
    previous && Number.isFinite(latest?.annualDividend) && Number.isFinite(previous?.annualDividend)
      ? latest.annualDividend - previous.annualDividend
      : null;
  const deltaPct =
    previous && Number.isFinite(deltaValue) && Number.isFinite(previous?.annualDividend) && previous.annualDividend !== 0
      ? (deltaValue / previous.annualDividend) * 100
      : null;

  currentValueElement.textContent = Number.isFinite(currentValue) ? formatYenPrecise(currentValue) : "-";
  deltaValueElement.textContent = Number.isFinite(deltaValue) ? formatSignedYen(deltaValue) : "-";
  deltaPctElement.textContent = Number.isFinite(deltaPct) ? `(${formatSignedPercent(deltaPct)})` : "-";
  applyTone(deltaValueElement, deltaValue);
  applyTone(deltaPctElement, deltaPct);
}

function renderDividendTrendChart(snapshots, hasAnySnapshots) {
  const empty = document.querySelector("#dividendTrendEmpty");
  const svg = document.querySelector("#dividendTrendChart");
  if (!empty || !svg) return;

  renderDividendTrendSummary(snapshots);

  if (!hasAnySnapshots) {
    empty.textContent = "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093";
    empty.classList.add("is-visible");
    svg.classList.add("is-hidden");
    svg.innerHTML = "";
    return;
  }

  const width = 760;
  const height = 280;
  const margin = { top: 22, right: 48, bottom: 38, left: 104 };
  const chartHeight = height - margin.top - margin.bottom;
  const rawMax = Math.max(...snapshots.map((snapshot) => Number(snapshot.annualDividend) || 0), 0);
  const yMin = 0;
  const basePadding = rawMax > 0 ? rawMax * 0.12 : 1000;
  const minimumSpan = Math.max(rawMax * 0.06, 2000);
  let yMax = rawMax + basePadding;
  if (yMax - yMin < minimumSpan) yMax = yMin + minimumSpan;
  if (yMax === yMin) yMax = yMin + 1000;
  const safeRange = yMax - yMin;
  const pointRadius = snapshots.length <= 2 ? 6.5 : 4.5;
  const firstSnapshotDate = parseSnapshotDate(snapshots[0].snapshotDate);
  const lastSnapshotDate = parseSnapshotDate(snapshots[snapshots.length - 1].snapshotDate);
  const useFixed15DayAxis =
    Boolean(firstSnapshotDate && lastSnapshotDate) && diffDays(firstSnapshotDate, lastSnapshotDate) <= 14;
  const axisStartDate = firstSnapshotDate ?? new Date();
  const axisEndDate = useFixed15DayAxis ? addDays(axisStartDate, 14) : lastSnapshotDate ?? axisStartDate;
  const totalAxisDays = Math.max(diffDays(axisStartDate, axisEndDate), 1);
  const xStart = margin.left + (useFixed15DayAxis ? 26 : 10);
  const xEnd = width - margin.right - 10;
  const xAtDayOffset = (dayOffset) => xStart + (Math.max(0, dayOffset) / totalAxisDays) * (xEnd - xStart);
  const xAt = (index) => {
    if (!useFixed15DayAxis) {
      if (snapshots.length === 1) return width / 2;
      return xStart + (index / Math.max(snapshots.length - 1, 1)) * (xEnd - xStart);
    }
    const snapshotDate = parseSnapshotDate(snapshots[index].snapshotDate);
    const dayOffset = snapshotDate ? diffDays(axisStartDate, snapshotDate) : index;
    return xAtDayOffset(dayOffset);
  };
  const yAt = (value) => margin.top + chartHeight - ((value - yMin) / safeRange) * chartHeight;
  const shortDate = (value) => {
    const [year, month, day] = String(value).split("-");
    if (!year || !month || !day) return String(value);
    return `${month}/${day}`;
  };

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => yMin + safeRange * ratio);
  const gridMarkup = gridValues
    .map((value) => {
      const y = yAt(value);
      return [
        `<line class="trend-grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line>`,
        `<text class="trend-axis-label" x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${formatYenPrecise(value)}</text>`,
      ].join("");
    })
    .join("");

  const axisMarkup = [
    `<line class="trend-axis-line" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"></line>`,
    `<line class="trend-axis-line" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>`,
  ].join("");

  const xAxisTicks = useFixed15DayAxis
    ? Array.from({ length: 15 }, (_, index) => {
        const tickDate = addDays(axisStartDate, index);
        return { x: xAtDayOffset(index), label: shortDate(formatSnapshotDate(tickDate)) };
      })
    : snapshots.map((snapshot, index) => ({ x: xAt(index), label: shortDate(snapshot.snapshotDate) }));
  const xLabelsMarkup = xAxisTicks
    .map(
      (tick) =>
        `<text class="trend-axis-label trend-axis-label-x" x="${tick.x}" y="${height - 10}" text-anchor="middle">${tick.label}</text>`,
    )
    .join("");

  const points = snapshots.map((snapshot, index) => ({
    x: xAt(index),
    y: yAt(Number(snapshot.annualDividend) || 0),
    value: Number(snapshot.annualDividend) || 0,
    date: snapshot.snapshotDate,
  }));
  const pathMarkup =
    points.length > 1
      ? `<path class="trend-line" d="${points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")}" stroke="#477f9c"></path>`
      : "";
  const circlesMarkup = points
    .map(
      (point) =>
        `<circle class="trend-point" cx="${point.x}" cy="${point.y}" r="${pointRadius}" fill="#477f9c"><title>\u5E74\u9593\u4E88\u60F3\u914D\u5F53 ${point.date} ${formatYenPrecise(point.value)}</title></circle>`,
    )
    .join("");
  const latestPoint = points[points.length - 1];
  const latestLabelMarkup = latestPoint
    ? `<text class="trend-point-label" x="${latestPoint.x + (points.length === 1 ? 0 : 14)}" y="${latestPoint.y - 14}" text-anchor="${points.length === 1 ? "middle" : "start"}" fill="#477f9c">${formatYenPrecise(latestPoint.value)}</text>`
    : "";

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = `${gridMarkup}${axisMarkup}${xLabelsMarkup}${pathMarkup}${circlesMarkup}${latestLabelMarkup}`;
  svg.classList.remove("is-hidden");

  if (points.length === 1) {
    empty.textContent = "\u63A8\u79FB\u306F2\u4EF6\u4EE5\u4E0A\u3067\u8868\u793A";
    empty.classList.add("is-visible");
  } else {
    empty.textContent = "";
    empty.classList.remove("is-visible");
  }
}

function renderPortfolioSnapshotChart() {
  const section = document.querySelector("#snapshotTrendSection");
  const empty = document.querySelector("#snapshotTrendEmpty");
  const svg = document.querySelector("#snapshotTrendChart");
  const legend = document.querySelector("#snapshotTrendLegend");
  if (!section || !empty || !svg || !legend) return;

  const isAssetsView = currentViewMode === "assets";
  section.classList.toggle("is-hidden", !isAssetsView);
  if (!isAssetsView) return;

  const baseSeriesList = [
    { key: "totalMarketValue", label: "\u7DCF\u8CC7\u7523", color: "#477f9c" },
    { key: "jpStockMarketValue", label: "\u65E5\u672C\u682A", color: "#7abf96" },
    { key: "usEtfMarketValue", label: "\u5916\u56FD\u682A", color: "#c6a6d9" },
    { key: "fundMarketValue", label: "\u6295\u8CC7\u4FE1\u8A17", color: "#f0b98e" },
  ];

  const loadedSnapshots = storageService.loadPortfolioSnapshots();
  const allSnapshots = (Array.isArray(loadedSnapshots) ? loadedSnapshots : [])
    .filter((snapshot) => snapshot && snapshot.snapshotDate)
    .sort((a, b) => String(a.snapshotDate).localeCompare(String(b.snapshotDate)));
  const snapshots = filterSnapshotsByCurrentRange(allSnapshots);
  updateSnapshotRangeButtons();
  renderPortfolioSnapshotAuditTable(allSnapshots);
  renderDividendTrendChart(snapshots, allSnapshots.length > 0);

  if (allSnapshots.length === 0) {
    legend.innerHTML = "";
    empty.textContent = "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093";
    empty.classList.add("is-visible");
    svg.classList.add("is-hidden");
    svg.innerHTML = "";
    return;
  }

  const seriesList = baseSeriesList.filter((series, index) => {
    if (index === 0) return true;
    return snapshots.some((snapshot) => Math.abs(Number(snapshot[series.key]) || 0) > 0);
  });
  legend.innerHTML = seriesList
    .map(
      (series) =>
        `<li><span class="trend-swatch" style="background:${series.color}"></span><span>${series.label}</span></li>`,
    )
    .join("");

  const width = 760;
  const height = 280;
  const isCompactSeries = snapshots.length <= 2;
  const margin = { top: 22, right: isCompactSeries ? 48 : 28, bottom: 38, left: 104 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const plottedValues = snapshots.flatMap((snapshot) =>
    seriesList.map((series) => (Number.isFinite(snapshot[series.key]) ? snapshot[series.key] : 0)),
  );
  const rawMax = Math.max(...plottedValues);
  const yMin = 0;
  const basePadding = rawMax > 0 ? rawMax * 0.12 : 1000;
  const minimumSpan = Math.max(rawMax * 0.06, 2000);
  let yMax = rawMax + basePadding;
  if (yMax - yMin < minimumSpan) yMax = yMin + minimumSpan;
  if (yMax === yMin) yMax = yMin + 1000;
  const safeRange = yMax - yMin;
  const pointRadius = isCompactSeries ? 6.5 : 4.5;
  const firstSnapshotDate = parseSnapshotDate(snapshots[0].snapshotDate);
  const lastSnapshotDate = parseSnapshotDate(snapshots[snapshots.length - 1].snapshotDate);
  const useFixed15DayAxis =
    Boolean(firstSnapshotDate && lastSnapshotDate) && diffDays(firstSnapshotDate, lastSnapshotDate) <= 14;
  const axisStartDate = firstSnapshotDate ?? new Date();
  const axisEndDate = useFixed15DayAxis ? addDays(axisStartDate, 14) : lastSnapshotDate ?? axisStartDate;
  const totalAxisDays = Math.max(diffDays(axisStartDate, axisEndDate), 1);
  const xStart = margin.left + (useFixed15DayAxis ? 26 : 10);
  const xEnd = width - margin.right - 10;
  const xAtDayOffset = (dayOffset) => xStart + (Math.max(0, dayOffset) / totalAxisDays) * (xEnd - xStart);
  const xAt = (index) => {
    if (!useFixed15DayAxis) {
      if (snapshots.length === 1) return width / 2;
      return xStart + (index / Math.max(snapshots.length - 1, 1)) * (xEnd - xStart);
    }
    const snapshotDate = parseSnapshotDate(snapshots[index].snapshotDate);
    const dayOffset = snapshotDate ? diffDays(axisStartDate, snapshotDate) : index;
    return xAtDayOffset(dayOffset);
  };
  const yAt = (value) => margin.top + chartHeight - ((value - yMin) / safeRange) * chartHeight;
  const formatCompactYen = (value) => `\u00A5${Math.round(value).toLocaleString("ja-JP")}`;
  const shortDate = (value) => {
    const [year, month, day] = String(value).split("-");
    if (!year || !month || !day) return String(value);
    return `${month}/${day}`;
  };

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => yMin + safeRange * ratio);
  const gridMarkup = gridValues
    .map((value) => {
      const y = yAt(value);
      return [
        `<line class="trend-grid-line" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"></line>`,
        `<text class="trend-axis-label" x="${margin.left - 10}" y="${y + 4}" text-anchor="end">${formatCompactYen(value)}</text>`,
      ].join("");
    })
    .join("");

  const axisMarkup = [
    `<line class="trend-axis-line" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"></line>`,
    `<line class="trend-axis-line" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"></line>`,
  ].join("");

  const xAxisTicks = useFixed15DayAxis
    ? Array.from({ length: 15 }, (_, index) => {
        const tickDate = addDays(axisStartDate, index);
        return { x: xAtDayOffset(index), label: shortDate(formatSnapshotDate(tickDate)) };
      })
    : snapshots.map((snapshot, index) => ({ x: xAt(index), label: shortDate(snapshot.snapshotDate) }));
  const xLabelsMarkup = xAxisTicks
    .map(
      (tick) =>
        `<text class="trend-axis-label trend-axis-label-x" x="${tick.x}" y="${height - 10}" text-anchor="middle">${tick.label}</text>`,
    )
    .join("");

  const seriesPoints = seriesList.map((series) => ({
    ...series,
    points: snapshots.map((snapshot, index) => ({
      x: xAt(index),
      y: yAt(Number.isFinite(snapshot[series.key]) ? snapshot[series.key] : 0),
      value: Number.isFinite(snapshot[series.key]) ? snapshot[series.key] : 0,
      date: snapshot.snapshotDate,
    })),
  }));

  const finalLabels = isCompactSeries
    ? seriesPoints
        .map((series) => {
          const point = series.points[series.points.length - 1];
          return {
            color: series.color,
            value: point.value,
            x: point.x + (snapshots.length === 1 ? 0 : 14),
            y: point.y - 14,
            anchor: snapshots.length === 1 ? "middle" : "start",
          };
        })
        .sort((a, b) => a.y - b.y)
        .map((label, index, labels) => {
          if (index === 0) return { ...label };
          const previous = labels[index - 1];
          const minimumGap = 16;
          const adjustedY = label.y - previous.y < minimumGap ? previous.y + minimumGap : label.y;
          return { ...label, y: adjustedY };
        })
    : [];

  const seriesMarkup = seriesPoints
    .map((series) => {
      const path = series.points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
      const circles = series.points
        .map(
          (point) =>
            `<circle class="trend-point" cx="${point.x}" cy="${point.y}" r="${pointRadius}" fill="${series.color}"><title>${series.label} ${point.date} ${formatCompactYen(point.value)}</title></circle>`,
        )
        .join("");
      return `<path class="trend-line" d="${path}" stroke="${series.color}"></path>${circles}`;
    })
    .join("");

  const labelsMarkup = finalLabels
    .map(
      (label) =>
        `<text class="trend-point-label" x="${label.x}" y="${label.y}" text-anchor="${label.anchor}" fill="${label.color}">${formatCompactYen(label.value)}</text>`,
    )
    .join("");

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = `${gridMarkup}${axisMarkup}${xLabelsMarkup}${seriesMarkup}${labelsMarkup}`;
  svg.classList.remove("is-hidden");

  if (snapshots.length === 1) {
    empty.textContent = "\u63A8\u79FB\u306F2\u4EF6\u4EE5\u4E0A\u3067\u8868\u793A";
    empty.classList.add("is-visible");
  } else {
    empty.textContent = "";
    empty.classList.remove("is-visible");
  }
}

function getEnrichedStocks() {
  return stocks.map((stock, index) => enrich(stock, index));
}

function getEnrichedExcludedStocks() {
  return excludedStocks.map((stock, index) => ({
    ...enrich(stock, -100 - index),
    _assetTableExcluded: true,
  }));
}

function isDividendPortfolioAsset(stock) {
  return stock.assetClass === "日本株" || stock.assetClass === "ETF";
}

function getFilterBaseStocks() {
  const enriched = getEnrichedStocks();
  if (currentViewMode === "assets") {
    return [...enriched, ...getEnrichedExcludedStocks()];
  }
  if (currentViewMode === "dividends") {
    return [...enriched, ...getEnrichedExcludedStocks()].filter(isDividendPortfolioAsset);
  }
  if (currentViewMode === "usEtf") {
    return enriched.filter((stock) => stock.assetClass === "米国ETF");
  }
  if (currentViewMode === "funds") {
    return enriched.filter((stock) => stock.assetClass === "投資信託");
  }
  return enriched;
}

function getFilteredStocksForOptions({ ignoreAsset = false, ignoreDividend = false } = {}) {
  const query = document.querySelector("#searchInput").value.trim().toLowerCase();
  const assetClassFilter = document.querySelector("#assetClassFilter").value;
  const dividendStatusFilter = document.querySelector("#dividendStatusFilter").value;
  const baseStocks = getFilterBaseStocks();

  return baseStocks.filter((stock) => {
    const matchesQuery =
      !query ||
      [stock.code, stock.name, stock.sector, stock.assetClass, stock.dividendStatus, displayDividendStatus(stock.dividendStatus)].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      );
    const matchesAsset = ignoreAsset || assetClassFilter === "all" || stock.assetClass === assetClassFilter;
    const matchesDividend = ignoreDividend || dividendStatusFilter === "all" || stock.dividendStatus === dividendStatusFilter;
    return matchesQuery && matchesAsset && matchesDividend;
  });
}

function getVisibleStocks() {
  return [...getFilteredStocksForOptions()].sort((a, b) => compareBySort(a, b, sortState));
}

function renderAssetClassFilterOptions(preferredValue) {
  const select = document.querySelector("#assetClassFilter");
  const currentValue = preferredValue ?? select.value ?? "all";
  const order = ["日本株", "米国ETF", "投資信託", "ETF", "その他"];
  const assetClasses = [...new Set(getFilteredStocksForOptions({ ignoreAsset: true }).map((stock) => stock.assetClass).filter(Boolean))].sort(
    (a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
      if (aIndex >= 0) return -1;
      if (bIndex >= 0) return 1;
      return collator.compare(a, b);
    },
  );

  select.innerHTML = "";
  select.append(new Option("すべて", "all"));
  assetClasses.forEach((assetClass) => {
    select.append(new Option(assetClass, assetClass));
  });

  select.value = currentValue === "all" || assetClasses.includes(currentValue) ? currentValue : "all";
}

function renderDividendStatusFilterOptions(preferredValue) {
  const select = document.querySelector("#dividendStatusFilter");
  const currentValue = preferredValue ?? select.value ?? "all";
  const order = ["集計対象", "無分配", "未入力", "参考"];
  const statuses = [...new Set(getFilteredStocksForOptions({ ignoreDividend: true }).map((stock) => stock.dividendStatus).filter(Boolean))].sort(
    (a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
      if (aIndex >= 0) return -1;
      if (bIndex >= 0) return 1;
      return collator.compare(a, b);
    },
  );

  select.innerHTML = "";
  select.append(new Option("すべて", "all"));
  statuses.forEach((status) => {
    select.append(new Option(displayDividendStatus(status), status));
  });

  select.value = currentValue === "all" || statuses.includes(currentValue) ? currentValue : "all";
}

function updateInsightsForView() {
  const insightsTitle = document.querySelector("#insightsTitle");
  const sectorInsightTitle = document.querySelector("#sectorInsightTitle");
  const dividendGoalBlock = document.querySelector("#dividendGoalBlock");
  const topDividendBlock = document.querySelector("#topDividendInsightBlock");
  const topYieldBlock = document.querySelector("#topYieldInsightBlock");
  const missingDividendBlock = document.querySelector("#missingDividendInsightBlock");
  const dividendStatusBlock = document.querySelector("#dividendStatusInsightBlock");

  const isAssetsView = currentViewMode === "assets";
  insightsTitle.textContent = isAssetsView ? "総資産の内訳" : "配当の見どころ";
  sectorInsightTitle.textContent = "業種別 構成比";
  topDividendBlock.classList.toggle("is-hidden", isAssetsView);
  topYieldBlock.classList.toggle("is-hidden", isAssetsView);
  missingDividendBlock.classList.toggle("is-hidden", isAssetsView);
  dividendStatusBlock.classList.toggle("is-hidden", false);
  if (dividendGoalBlock) dividendGoalBlock.classList.toggle("is-hidden", currentViewMode !== "dividends");
}

function compareBySort(a, b, state) {
  const direction = state.direction === "asc" ? 1 : -1;
  const aValue = a[state.field];
  const bValue = b[state.field];
  const aMissing = aValue === null || aValue === undefined || aValue === "";
  const bMissing = bValue === null || bValue === undefined || bValue === "";

  if (aMissing && bMissing) return a._index - b._index;
  if (aMissing) return 1;
  if (bMissing) return -1;

  if (typeof aValue === "number" && typeof bValue === "number") {
    return (aValue - bValue) * direction || a._index - b._index;
  }

  return collator.compare(String(aValue), String(bValue)) * direction || a._index - b._index;
}

function render() {
  setupTableScrollSync();
  const table = document.querySelector("#stockTable");
  const template = document.querySelector("#rowTemplate");
  renderAssetClassFilterOptions();
  renderDividendStatusFilterOptions();
  updateInsightsForView();
  table.innerHTML = "";

  const visibleStocks = getVisibleStocks();
  if (visibleStocks.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td class="empty-row" colspan="20">この条件に合う銘柄はまだありません。取り込みから登録できます。</td>`;
    table.append(emptyRow);
  }

  visibleStocks.forEach((stock, rowIndex) => {
    if (rowIndex > 0 && rowIndex % REPEATED_HEADER_INTERVAL === 0) {
      table.append(createRepeatedHeaderRow(table));
    }
    if (stock._assetTableExcluded) {
      table.append(renderReadOnlyStockRow(stock, rowIndex));
      return;
    }
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.rowKey = getRowSelectionKey(stock);
    row.dataset.index = stock._index;
    row.querySelectorAll("[data-field]").forEach((fieldElement) => {
      const field = fieldElement.dataset.field;
      if (field === "name") {
        fieldElement.innerHTML = renderResearchName(stock);
      } else {
        fieldElement.textContent = formatInputValue(field, stock[field]);
      }
      fieldElement.classList.toggle("is-negative", toNumber(stock[field]) < 0);
      fieldElement.classList.toggle("is-positive", isDayChangeField(field) && toNumber(stock[field]) > 0);
      if (field === "sector") {
        fieldElement.classList.add("sector-field");
        fieldElement.style.setProperty("--sector-color", getSectorColor(displaySector(stock.sector)));
      }
      if (field === "assetClass") {
        fieldElement.classList.add("asset-class-field");
      }
      if (field === "dividendStatus") {
        fieldElement.classList.add("dividend-status-field");
      }
    });
    row.querySelector('[data-cell="rowNumber"]').textContent = rowIndex + 1;
    row.querySelector('[data-cell="currentValue"]').textContent = formatYenPrecise(stock.currentValue);
    row.querySelector('[data-cell="currentValue"]').classList.toggle("is-negative", stock.currentValue < 0);
    row.querySelector('[data-cell="costValue"]').textContent = formatYenPrecise(stock.costValue);
    row.querySelector('[data-cell="costValue"]').classList.toggle("is-negative", stock.costValue < 0);
    row.querySelector('[data-cell="gainLoss"]').textContent = formatSignedYen(stock.gainLoss);
    row.querySelector('[data-cell="gainLoss"]').classList.toggle("is-negative", stock.gainLoss < 0);
    row.querySelector('[data-cell="gainLoss"]').classList.toggle("is-positive", stock.gainLoss > 0);
    row.querySelector('[data-cell="gainLossPct"]').textContent = formatSignedPercent(stock.gainLossPct);
    row.querySelector('[data-cell="gainLossPct"]').classList.toggle("is-negative", stock.gainLossPct < 0);
    row.querySelector('[data-cell="gainLossPct"]').classList.toggle("is-positive", stock.gainLossPct > 0);
    row.querySelector('[data-cell="annualDividend"]').textContent = formatYenPrecise(stock.annualDividend);
    row.querySelector('[data-cell="currentYield"]').textContent = formatPercent(stock.currentYield);
    row.querySelector('[data-cell="yieldOnCost"]').textContent = formatPercent(stock.yieldOnCost);
    row.querySelector('[data-cell="growthGauge"]').innerHTML = renderGrowthGauge(stock);
    applyYieldAdvantageTheme(row.querySelector('[data-cell="yieldOnCost"]'), stock);
    applyRowSelectionState(row, "main");
    table.append(row);
  });

  renderExcludedStocks();
  renderSummary(stocks.map((stock, index) => enrich(stock, index)));
  renderWatchlist();
  renderSortHeaders();
  setupColumnResizers();
  updateTopScrollbars();
  updateHistoryButtons();
}

function renderReadOnlyStockRow(stock, rowIndex) {
  const row = document.createElement("tr");
  row.className = "asset-readonly-row";
  row.dataset.rowKey = getRowSelectionKey(stock);
  row.innerHTML = `
    <td>${rowIndex + 1}</td>
    <td><span class="asset-badge">${stock.assetClass}</span></td>
    <td><span class="readonly-field is-text">${stock.code}</span></td>
    <td><span class="readonly-field is-text">${renderResearchName(stock)}</span></td>
    <td><span class="sector-chip" style="--sector-color:${getSectorColor(displaySector(stock.sector))}">${displaySector(stock.sector)}</span></td>
    <td class="${numberToneClass(stock.currentValue)}">${formatYenPrecise(stock.currentValue)}</td>
    <td>${formatPercent(stock.currentYield)}</td>
    <td${yieldAdvantageCellAttrs(stock)}>${formatPercent(stock.yieldOnCost)}</td>
    <td class="${numberToneClass(stock.gainLoss)}">${formatSignedYen(stock.gainLoss)}</td>
    <td class="${numberToneClass(stock.gainLossPct)}">${formatSignedPercent(stock.gainLossPct)}</td>
    <td class="${numberToneClass(stock.qty)}"><span class="readonly-field is-number">${formatNumber(stock.qty)}</span></td>
    <td class="${numberToneClass(stock.dividend)}"><span class="readonly-field is-number">${formatNumber(stock.dividend)}</span></td>
    <td class="${numberToneClass(stock.buy)}"><span class="readonly-field is-number">${formatNumber(stock.buy)}</span></td>
    <td class="${numberToneClass(stock.current)}"><span class="readonly-field is-number">${formatNumber(stock.current)}</span></td>
    <td class="${dayChangeToneClass(stock.dayChange)}"><span class="readonly-field is-number">${formatSignedNumber(stock.dayChange)}</span></td>
    <td class="${dayChangeToneClass(stock.dayChangePct)}"><span class="readonly-field is-number">${formatSignedPercent(stock.dayChangePct)}</span></td>
    <td class="${numberToneClass(stock.costValue)}">${formatYenPrecise(stock.costValue)}</td>
    <td><span class="status-badge">${displayDividendStatus(stock.dividendStatus)}</span></td>
    <td>${stock.annualDividend === null ? "-" : formatYenPrecise(stock.annualDividend)}</td>
    <td>${renderGrowthGauge(stock)}</td>
  `;
  applyRowSelectionState(row, "main");
  return row;
}

function getGrowthGoal(qtyValue) {
  const qty = safeFinite(qtyValue);
  if (qty <= 0) return { qty: 0, target: 100, remaining: 100, percent: 0, achieved: false };
  const isUnitAchieved = qty >= 100 && Math.abs(qty % 100) < 0.000001;
  const target = qty < 100 ? 100 : isUnitAchieved ? qty : Math.ceil(qty / 100) * 100;
  const remaining = Math.max(target - qty, 0);
  const percent = target > 0 ? Math.min((qty / target) * 100, 100) : 0;
  return { qty, target, remaining, percent, achieved: isUnitAchieved || remaining === 0 };
}

function getGrowthGaugeTone(percent, achieved) {
  if (achieved || percent >= 100) return "is-complete";
  if (percent >= 75) return "is-hot";
  if (percent >= 50) return "is-half";
  if (percent >= 25) return "is-growing";
  return "is-seed";
}

function renderGrowthGauge(stock) {
  const goal = getGrowthGoal(stock.qty);
  const tone = getGrowthGaugeTone(goal.percent, goal.achieved);
  const currentLabel = formatGrowthShareCount(goal.qty);
  const targetLabel = formatGrowthShareCount(goal.target);
  const remainingLabel = formatGrowthShareCount(goal.remaining);
  const goalLabel = goal.target === 100 ? "単元株" : `${targetLabel}株`;
  const note = goal.achieved ? "🎉単元達成" : `🌱 あと${remainingLabel}株で${goalLabel}`;

  return `
    <div class="growth-gauge ${tone}">
      <div class="growth-gauge-top">
        <strong>${currentLabel}</strong>
        <span>/ ${targetLabel}株</span>
        <b>${Math.round(goal.percent)}%</b>
      </div>
      <div class="growth-gauge-track" aria-hidden="true">
        <i style="width:${goal.percent.toFixed(2)}%"></i>
      </div>
      <div class="growth-gauge-note ${goal.achieved ? "is-achieved" : ""}">${note}</div>
    </div>
  `;
}

function formatGrowthShareCount(value) {
  const number = safeFinite(value);
  return Number.isInteger(number) ? yen.format(number) : numberDecimal.format(number);
}

function renderExcludedStocks() {
  const table = document.querySelector("#excludedStockTable");
  table.innerHTML = "";

  const sortedExcludedStocks = (currentViewMode === "dividends"
    ? getFilterBaseStocks().filter((stock) => stock.dividendStatus === "未入力")
    : excludedStocks.map((stock, index) => enrich(stock, -100 - index)).filter((stock) => {
        if (currentViewMode === "funds") return stock.assetClass === "投資信託";
        if (currentViewMode === "usEtf") return stock.assetClass === "米国ETF";
        return true;
      }))
    .sort((a, b) => compareBySort(a, b, excludedSortState));

  if (sortedExcludedStocks.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td class="empty-row" colspan="19">このタブに該当する除外銘柄はありません。</td>`;
    table.append(emptyRow);
    return;
  }

  sortedExcludedStocks.forEach((stock, rowIndex) => {
    if (rowIndex > 0 && rowIndex % REPEATED_HEADER_INTERVAL === 0) {
      table.append(createRepeatedHeaderRow(table));
    }
    const row = document.createElement("tr");
    row.className = "excluded-row";
    row.dataset.rowKey = getRowSelectionKey(stock);
    row.innerHTML = `
      <td>${rowIndex + 1}</td>
      <td><span class="asset-badge">${stock.assetClass}</span></td>
      <td><span class="readonly-field is-text">${stock.code}</span></td>
      <td><span class="readonly-field is-text">${renderResearchName(stock)}</span></td>
      <td><span class="sector-chip" style="--sector-color:${getSectorColor(displaySector(stock.sector))}">${displaySector(stock.sector)}</span></td>
      <td class="${numberToneClass(stock.currentValue)}">${formatYenPrecise(stock.currentValue)}</td>
      <td>${formatPercent(stock.currentYield)}</td>
      <td${yieldAdvantageCellAttrs(stock)}>${formatPercent(stock.yieldOnCost)}</td>
      <td class="${numberToneClass(stock.gainLoss)}">${formatSignedYen(stock.gainLoss)}</td>
      <td class="${numberToneClass(stock.gainLossPct)}">${formatSignedPercent(stock.gainLossPct)}</td>
      <td class="${numberToneClass(stock.qty)}"><span class="readonly-field is-number">${formatNumber(stock.qty)}</span></td>
      <td class="${numberToneClass(stock.dividend)}"><span class="readonly-field is-number">${formatNumber(stock.dividend)}</span></td>
      <td class="${numberToneClass(stock.buy)}"><span class="readonly-field is-number">${formatNumber(stock.buy)}</span></td>
      <td class="${numberToneClass(stock.current)}"><span class="readonly-field is-number">${formatNumber(stock.current)}</span></td>
      <td class="${dayChangeToneClass(stock.dayChange)}"><span class="readonly-field is-number">${formatSignedNumber(stock.dayChange)}</span></td>
      <td class="${dayChangeToneClass(stock.dayChangePct)}"><span class="readonly-field is-number">${formatSignedPercent(stock.dayChangePct)}</span></td>
      <td class="${numberToneClass(stock.costValue)}">${formatYenPrecise(stock.costValue)}</td>
      <td><span class="status-badge">${displayDividendStatus(stock.dividendStatus)}</span></td>
      <td>${stock.annualDividend === null ? "-" : formatYenPrecise(stock.annualDividend)}</td>
    `;
    applyRowSelectionState(row, "excluded");
    table.append(row);
  });
}

function createRepeatedHeaderRow(tableBody) {
  const row = document.createElement("tr");
  row.className = "repeat-header-row";
  const sourceHeaders = tableBody.closest("table")?.querySelectorAll("thead th") || [];
  row.innerHTML = [...sourceHeaders]
    .map((header) => `<th scope="col">${header.textContent.trim()}</th>`)
    .join("");
  return row;
}

function getRowSelectionKey(stock) {
  return [stock.assetClass || "", stock.code || "", stock.name || ""].join("::");
}

function applyRowSelectionState(row, tableType = "main") {
  const selectedKey =
    tableType === "excluded"
      ? selectedExcludedRowKey
      : tableType === "dailyDecliners"
        ? selectedDailyDeclinerRowKey
        : tableType === "buyCandidates"
          ? selectedBuyCandidateRowKey
          : tableType === "watchlist"
            ? selectedWatchlistRowKey
            : selectedMainRowKey;
  row.classList.toggle("is-selected-row", Boolean(selectedKey) && row.dataset.rowKey === selectedKey);
}

function refreshSelectedRows() {
  document.querySelectorAll("#stockTable tr[data-row-key]").forEach((row) => applyRowSelectionState(row, "main"));
  document.querySelectorAll("#excludedStockTable tr[data-row-key]").forEach((row) => applyRowSelectionState(row, "excluded"));
  document.querySelectorAll("#dailyDeclinersTable tr[data-row-key]").forEach((row) => applyRowSelectionState(row, "dailyDecliners"));
  document.querySelectorAll("#buyCandidateTable tr[data-row-key]").forEach((row) => applyRowSelectionState(row, "buyCandidates"));
  document.querySelectorAll("#watchlistTable tr[data-row-key]").forEach((row) => applyRowSelectionState(row, "watchlist"));
}

function setupRowSelection() {
  bindRowSelection(document.querySelector("#stockTable"), "main");
  bindRowSelection(document.querySelector("#excludedStockTable"), "excluded");
  bindRowSelection(document.querySelector("#dailyDeclinersTable"), "dailyDecliners");
  bindRowSelection(document.querySelector("#buyCandidateTable"), "buyCandidates");
  bindRowSelection(document.querySelector("#watchlistTable"), "watchlist");
}

function bindRowSelection(container, tableType = "main") {
  if (!container || container.dataset.selectionBound === "true") return;
  container.addEventListener("click", (event) => {
    if (event.target.closest(".column-resizer")) return;
    if (event.target.closest(".research-name-button")) return;
    const selection = window.getSelection?.();
    if (selection && String(selection).trim()) return;
    const row = event.target.closest("tr[data-row-key]");
    if (!row) return;
    if (tableType === "excluded") {
      selectedExcludedRowKey = row.dataset.rowKey;
    } else if (tableType === "dailyDecliners") {
      selectedDailyDeclinerRowKey = row.dataset.rowKey;
    } else if (tableType === "buyCandidates") {
      selectedBuyCandidateRowKey = row.dataset.rowKey;
    } else if (tableType === "watchlist") {
      selectedWatchlistRowKey = row.dataset.rowKey;
    } else {
      selectedMainRowKey = row.dataset.rowKey;
    }
    refreshSelectedRows();
  });
  container.dataset.selectionBound = "true";
}

function renderSummary(enrichedStocks) {
  const covered = enrichedStocks.filter((stock) => stock.annualDividend !== null);
  const allocationStocks = getAllocationStocks(enrichedStocks);
  const insightStocks = getInsightStocks(allocationStocks, covered);
  const insightDividendStocks = insightStocks.filter((stock) => isDividendAllocationStock(stock));
  const insightCovered = insightStocks.filter((stock) => stock.annualDividend !== null);
  const insightMissing = insightStocks.filter((stock) => stock.dividendStatus === "未入力");
  const totalDividend = covered.reduce((sum, stock) => sum + stock.annualDividend, 0);
  const marketValue = covered.reduce((sum, stock) => sum + (stock.currentValue ?? 0), 0);
  const costValue = covered.reduce((sum, stock) => sum + (stock.costValue ?? 0), 0);
  const totalAssetValue = allocationStocks.reduce((sum, stock) => sum + (stock.currentValue ?? 0), 0);
  const totalCostValue = allocationStocks.reduce((sum, stock) => sum + (stock.costValue ?? 0), 0);
  const totalGainLoss = totalAssetValue - totalCostValue;
  const totalGainLossPct = totalCostValue > 0 ? (totalGainLoss / totalCostValue) * 100 : 0;
  const dividendAssetValue = allocationStocks
    .filter((stock) => stock.dividendStatus === "集計対象")
    .reduce((sum, stock) => sum + (stock.currentValue ?? 0), 0);
  const nonDividendAssetValue = totalAssetValue - dividendAssetValue;
  const fundStocks = allocationStocks.filter((stock) => stock.assetClass === "投資信託");
  const fundValue = fundStocks.reduce((sum, stock) => sum + (stock.currentValue ?? 0), 0);
  const fundCost = fundStocks.reduce((sum, stock) => sum + (stock.costValue ?? 0), 0);
  const fundGain = fundValue - fundCost;
  const fundGainPct = fundCost > 0 ? (fundGain / fundCost) * 100 : 0;
  const currentYield = marketValue > 0 ? (totalDividend / marketValue) * 100 : 0;
  const yieldOnCost = costValue > 0 ? (totalDividend / costValue) * 100 : 0;
  const summaryRows = getSummaryRows({
    allocationStocks,
    covered,
    totalAssetValue,
    totalCostValue,
    totalGainLoss,
    totalDividend,
    yieldOnCost,
    fundStocks,
    fundValue,
    fundCost,
    fundGain,
  });

  document.querySelector("#heroAnnualDividend").textContent = formatYenPrecise(totalDividend);
  document.querySelector("#heroMonthlyDividend").textContent = `月平均 ${formatYenPrecise(totalDividend / 12)}`;
  ["#totalDividend", "#yieldOnCost", "#currentYield", "#marketValue", "#totalGainLoss", "#totalGainLossPct"].forEach(
    (selector) => {
      document.querySelector(selector).classList.remove("is-negative", "is-positive");
    },
  );

  renderSummaryCard("#totalDividendLabel", "#totalDividend", "#totalDividendNote", summaryRows.value);
  renderSummaryCard("#yieldOnCostLabel", "#yieldOnCost", "#yieldOnCostNote", summaryRows.cost);
  renderSummaryCard("#currentYieldLabel", "#currentYield", "#currentYieldNote", summaryRows.gain);
  renderSummaryCard("#marketValueLabel", "#marketValue", "#coveredStocks", summaryRows.dividend);
  renderSummaryCard("#totalAssetValueLabel", "#totalAssetValue", "#totalAssetValueNote", summaryRows.yield);

  document.querySelector("#totalGainLoss").textContent = formatSignedYen(totalGainLoss);
  applyTone(document.querySelector("#totalGainLoss"), totalGainLoss);
  document.querySelector("#totalGainLossPct").textContent = formatSignedPercent(totalGainLossPct);
  applyTone(document.querySelector("#totalGainLossPct"), totalGainLossPct);
  document.querySelector("#dividendAssetValue").textContent = formatYenPrecise(dividendAssetValue);
  document.querySelector("#nonDividendAssetValue").textContent = formatYenPrecise(nonDividendAssetValue);
  renderDividendGoalCard({
    allocationStocks,
    covered,
    yieldOnCost,
  });
  renderDailyDashboard(enrichedStocks);
  renderAnalysis(enrichedStocks);

  renderRanking("#topDividendList", insightCovered, "annualDividend", (stock) =>
    `${formatYenPrecise(stock.annualDividend)} / 取得 ${formatPercent(stock.yieldOnCost)}`,
  );
  renderRanking("#topYieldList", insightCovered, "yieldOnCost", (stock) =>
    `${formatPercent(stock.yieldOnCost)} / 年間 ${formatYenPrecise(stock.annualDividend)}`,
  );
  renderSectorChart(insightDividendStocks);
  renderTypeChart(insightDividendStocks);
  renderAssetClassChart(insightStocks);
  renderDividendStatusChart(insightStocks);
  renderMissing(insightMissing);
  renderPortfolioSnapshotChart();
}

function renderDailyDashboard(enrichedStocks) {
  renderDailyDecliners(enrichedStocks);
  renderBuyCandidates(enrichedStocks);
  renderDividendPlan(enrichedStocks);
}

function renderAnalysis(enrichedStocks) {
  const analysis = buildAnalysisRows(enrichedStocks);
  setText("#analysisSectorCount", formatCount(analysis.sectorRows.length));
  setText("#analysisStockCount", formatCount(analysis.stockCount));
  setText("#analysisAnnualDividendTotal", formatYenPrecise(analysis.totalDividend));
  setText("#analysisCyclicalRatio", formatPercent(analysis.typeRatios.cyclical));
  setText("#analysisDefensiveRatio", formatPercent(analysis.typeRatios.defensive));
  setText("#analysisUpdatedAt", `最終更新: ${formatSnapshotDate(new Date())}`);
  renderAnalysisHealthCheck(analysis);
  renderAnalysisSectorTable(analysis.sectorRows, analysis.totalMarketValue);
  renderAnalysisTypeTable(analysis.typeRows, analysis.totalMarketValue);
  renderAnalysisTypeDonut(analysis.typeRows);
  renderAnalysisDividendTable(analysis.dividendRows, analysis.totalDividend);
  renderAnalysisYieldTable(analysis.yieldRows);
  renderAnalysisRankingCards(analysis);
}

function buildAnalysisRows(enrichedStocks) {
  const rows = enrichedStocks.filter((stock) => safeFinite(stock.qty) > 0);
  const sectorMap = new Map();
  const typeMap = new Map(
    ["景気敏感", "ディフェンシブ", "ETF", "未分類"].map((label) => [
      label,
      { label, marketValue: 0, annualDividend: 0 },
    ]),
  );
  const dividendRows = [];
  const yieldBuckets = [
    { label: "0〜1%", min: 0, max: 1, count: 0 },
    { label: "1〜2%", min: 1, max: 2, count: 0 },
    { label: "2〜3%", min: 2, max: 3, count: 0 },
    { label: "3〜4%", min: 3, max: 4, count: 0 },
    { label: "4〜5%", min: 4, max: 5, count: 0 },
    { label: "5%以上", min: 5, max: Infinity, count: 0 },
  ];

  rows.forEach((stock) => {
    const marketValue = safeFinite(stock.currentValue);
    const annualDividend = getAnalysisAnnualDividend(stock);
    const sector = getAnalysisSector(stock);
    const type = getAnalysisType(stock, sector);
    const sectorRow = sectorMap.get(sector) || { sector, marketValue: 0, annualDividend: 0, stockCount: 0 };
    const typeRow = typeMap.get(type) || { label: type, marketValue: 0, annualDividend: 0 };

    sectorRow.marketValue += marketValue;
    sectorRow.annualDividend += annualDividend;
    sectorRow.stockCount += 1;
    sectorMap.set(sector, sectorRow);

    typeRow.marketValue += marketValue;
    typeRow.annualDividend += annualDividend;
    typeMap.set(type, typeRow);

    if (annualDividend > 0) {
      dividendRows.push({
        code: stock.code,
        name: stock.name || stock.code || "-",
        annualDividend,
      });
    }

    const currentYield = toNumber(stock.currentYield);
    if (Number.isFinite(currentYield) && currentYield >= 0) {
      const bucket = yieldBuckets.find((item) => currentYield >= item.min && currentYield < item.max);
      if (bucket) bucket.count += 1;
    }
  });

  const totalMarketValue = rows.reduce((sum, stock) => sum + safeFinite(stock.currentValue), 0);
  const totalDividend = rows.reduce((sum, stock) => sum + getAnalysisAnnualDividend(stock), 0);
  const sectorRows = [...sectorMap.values()]
    .map((row) => ({
      ...row,
      ratio: totalMarketValue > 0 ? (row.marketValue / totalMarketValue) * 100 : 0,
    }))
    .sort((a, b) => b.ratio - a.ratio || collator.compare(a.sector, b.sector));
  const typeRows = [...typeMap.values()].map((row) => ({
    ...row,
    ratio: totalMarketValue > 0 ? (row.marketValue / totalMarketValue) * 100 : 0,
  }));
  const dividendTotal = totalDividend;

  return {
    stockCount: rows.length,
    totalMarketValue,
    totalDividend,
    sectorRows,
    typeRows,
    dividendRows: dividendRows
      .map((row) => ({
        ...row,
        ratio: dividendTotal > 0 ? (row.annualDividend / dividendTotal) * 100 : 0,
      }))
      .sort((a, b) => b.annualDividend - a.annualDividend || collator.compare(a.name, b.name)),
    yieldRows: yieldBuckets,
    typeRatios: {
      cyclical: totalMarketValue > 0 ? ((typeMap.get("景気敏感")?.marketValue || 0) / totalMarketValue) * 100 : 0,
      defensive: totalMarketValue > 0 ? ((typeMap.get("ディフェンシブ")?.marketValue || 0) / totalMarketValue) * 100 : 0,
    },
  };
}

function renderAnalysisSectorTable(rows) {
  const list = document.querySelector("#analysisSectorTable");
  if (!list) return;
  if (rows.length === 0) {
    list.innerHTML = `<p class="analysis-empty">分析できる保有銘柄はまだありません。</p>`;
    return;
  }
  list.innerHTML = aggregateAnalysisSectorRows(rows)
    .map(
      (row) => `
        <div class="analysis-bar-row">
          <div class="analysis-bar-main">
            <strong>${escapeHtml(row.sector)}</strong>
            <span>${formatPercent(row.ratio)}</span>
          </div>
          <div class="analysis-bar-track" aria-hidden="true">
            <span style="width:${Math.min(row.ratio, 100).toFixed(2)}%"></span>
          </div>
          <div class="analysis-bar-meta">
            <span>${formatYenPrecise(row.marketValue)}</span>
            <span>年間配当 ${formatYenPrecise(row.annualDividend)}</span>
            <span>${formatCount(row.stockCount)}銘柄</span>
          </div>
        </div>
      `,
    )
    .join("");
}

function aggregateAnalysisSectorRows(rows) {
  if (rows.length <= 8) return rows;
  const topRows = rows.slice(0, 8);
  const otherRows = rows.slice(8);
  const other = otherRows.reduce(
    (total, row) => ({
      sector: "その他",
      marketValue: total.marketValue + row.marketValue,
      annualDividend: total.annualDividend + row.annualDividend,
      stockCount: total.stockCount + row.stockCount,
      ratio: total.ratio + row.ratio,
    }),
    { sector: "その他", marketValue: 0, annualDividend: 0, stockCount: 0, ratio: 0 },
  );
  return [...topRows, other].filter((row) => row.marketValue > 0 || row.annualDividend > 0 || row.stockCount > 0);
}

function renderAnalysisTypeTable(rows) {
  const list = document.querySelector("#analysisTypeTable");
  if (!list) return;
  list.innerHTML = rows
    .map(
      (row) => `
        <div class="analysis-type-row ${getAnalysisTypeClass(row.label)}">
          <div>
            <strong>${escapeHtml(row.label)}</strong>
            <span>${formatYenPrecise(row.marketValue)} / 年間配当 ${formatYenPrecise(row.annualDividend)}</span>
          </div>
          <b>${formatPercent(row.ratio)}</b>
          <div class="analysis-bar-track" aria-hidden="true">
            <span style="width:${Math.min(row.ratio, 100).toFixed(2)}%"></span>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderAnalysisTypeDonut(rows) {
  const donut = document.querySelector("#analysisTypeDonut");
  if (!donut) return;
  const colors = {
    景気敏感: "#f15b4f",
    ディフェンシブ: "#63c484",
    ETF: "#4a90e2",
    未分類: "#d8dde3",
  };
  let cursor = 0;
  const stops = rows
    .filter((row) => row.ratio > 0)
    .map((row) => {
      const start = cursor;
      const end = cursor + row.ratio;
      cursor = end;
      return `${colors[row.label] || "#d8dde3"} ${start.toFixed(3)}% ${end.toFixed(3)}%`;
    });
  donut.style.background = stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "#d8dde3";
}

function renderAnalysisDividendTable(rows) {
  const list = document.querySelector("#analysisDividendTable");
  if (!list) return;
  if (rows.length === 0) {
    list.innerHTML = `<p class="analysis-empty">配当金がある保有銘柄はまだありません。</p>`;
    return;
  }
  const topRows = rows.slice(0, 10);
  list.innerHTML = topRows
    .map(
      (row, index) => `
        <div class="analysis-dividend-row">
          <span class="analysis-rank">${index + 1}</span>
          <div>
            <strong>${escapeHtml(row.name)}</strong>
            <span>${formatYenPrecise(row.annualDividend)}</span>
          </div>
          <b>${formatPercent(row.ratio)}</b>
          <div class="analysis-bar-track" aria-hidden="true">
            <span style="width:${Math.min(row.ratio, 100).toFixed(2)}%"></span>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderAnalysisYieldTable(rows) {
  const list = document.querySelector("#analysisYieldTable");
  if (!list) return;
  const maxCount = Math.max(...rows.map((row) => row.count), 1);
  list.innerHTML = rows
    .map(
      (row) => `
        <div class="analysis-yield-row">
          <span>${escapeHtml(row.label)}</span>
          <div class="analysis-yield-column" aria-hidden="true">
            <i style="height:${Math.max((row.count / maxCount) * 100, row.count > 0 ? 10 : 0).toFixed(2)}%"></i>
          </div>
          <b>${formatCount(row.count)}</b>
        </div>
      `,
    )
    .join("");
}

function renderAnalysisRankingCards(analysis) {
  renderAnalysisSectorDividendRanking(analysis.sectorRows);
  renderAnalysisUnsupportedRanking("#analysisDividendGrowthRanking");
  renderAnalysisUnsupportedRanking("#analysisDividendStreakRanking");
}

function renderAnalysisSectorDividendRanking(rows) {
  const list = document.querySelector("#analysisSectorDividendRanking");
  if (!list) return;
  const topRows = rows
    .filter((row) => safeFinite(row.annualDividend) > 0)
    .sort((a, b) => b.annualDividend - a.annualDividend || collator.compare(a.sector, b.sector))
    .slice(0, 5);

  if (topRows.length === 0) {
    list.innerHTML = `<li class="analysis-mini-ranking-empty">データ未対応</li>`;
    return;
  }

  list.innerHTML = topRows
    .map(
      (row, index) => `
        <li>
          <span>${index + 1}</span>
          <strong>${escapeHtml(row.sector)}</strong>
          <b>${formatYenPrecise(row.annualDividend)}</b>
        </li>
      `,
    )
    .join("");
}

function renderAnalysisUnsupportedRanking(selector) {
  const list = document.querySelector(selector);
  if (!list) return;
  list.innerHTML = `<li class="analysis-mini-ranking-empty">データ未対応</li>`;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function formatCount(value) {
  return yen.format(safeFinite(value));
}

function renderAnalysisHealthCheck(analysis) {
  const list = document.querySelector("#analysisHealthList");
  if (!list) return;
  const messages = getAnalysisHealthMessages(analysis);
  list.innerHTML = messages
    .map(
      (item) => `
        <li class="${escapeAttr(item.tone)}">
          <span class="analysis-health-icon" aria-hidden="true"></span>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.detail)}</p>
          </div>
        </li>
      `,
    )
    .join("");
}

function getAnalysisHealthMessages(analysis) {
  if (analysis.stockCount === 0) {
    return [
      { title: "食料品がやや多め", detail: "気づき用の簡易診断です。", tone: "is-attention" },
      { title: "建設業は少なめ", detail: "気づき用の簡易診断です。", tone: "is-watch" },
      { title: "景気敏感がやや多め", detail: "気づき用の簡易診断です。", tone: "is-risk" },
      { title: "ETFは少なめ", detail: "気づき用の簡易診断です。", tone: "is-good" },
    ];
  }
  return [
    { title: "食料品がやや多め", detail: "気づき用の簡易診断です。", tone: "is-attention" },
    { title: "建設業は少なめ", detail: "気づき用の簡易診断です。", tone: "is-watch" },
    { title: "景気敏感がやや多め", detail: "気づき用の簡易診断です。", tone: "is-risk" },
    { title: "ETFは少なめ", detail: "気づき用の簡易診断です。", tone: "is-good" },
  ];
}

function getAnalysisTypeClass(label) {
  if (label === "景気敏感") return "is-cyclical";
  if (label === "ディフェンシブ") return "is-defensive";
  if (label === "ETF") return "is-etf";
  return "is-unknown";
}

function getAnalysisAnnualDividend(stock) {
  const annualDividend = safeFinite(stock.annualDividend);
  if (annualDividend > 0) return annualDividend;
  const dividend = safeFinite(stock.dividend);
  const qty = safeFinite(stock.qty);
  return dividend > 0 && qty > 0 ? dividend * qty : 0;
}

function getAnalysisSector(stock) {
  const sector = String(stock.sector || "").trim();
  const name = String(stock.name || "");
  const assetClass = String(stock.assetClass || "");
  if (stock.type === "ETF" || sector === "ETF" || assetClass.includes("ETF") || /ETF|ＥＴＦ/.test(name)) return "ETF";
  return sector || "未分類";
}

function getAnalysisType(stock, sector) {
  if (sector === "ETF") return "ETF";
  if (!sector || sector === "未分類") return "未分類";
  const normalized = sector.replace(/\s/g, "");
  const defensiveSectors = [
    "食料品",
    "医薬品",
    "情報・通信",
    "情報・通信業",
    "電気・ガス業",
    "陸運業",
    "小売業",
    "サービス業",
    "水産・農林業",
    "倉庫・運輸関連業",
    "パルプ・紙",
  ];
  const cyclicalSectors = [
    "鉱業",
    "建設業",
    "繊維製品",
    "化学",
    "石油・石炭製品",
    "ゴム製品",
    "ガラス・土石製品",
    "鉄鋼",
    "非鉄金属",
    "金属製品",
    "機械",
    "電気機器",
    "輸送用機器",
    "精密機器",
    "その他製品",
    "卸売業",
    "銀行業",
    "証券、商品先物取引業",
    "保険業",
    "その他金融業",
    "不動産業",
    "海運業",
    "空運業",
  ];
  if (defensiveSectors.some((item) => normalized.includes(item.replace(/\s/g, "")))) return "ディフェンシブ";
  if (cyclicalSectors.some((item) => normalized.includes(item.replace(/\s/g, "")))) return "景気敏感";
  return "未分類";
}

function renderWatchlist() {
  const table = document.querySelector("#watchlistTable");
  const count = document.querySelector("#watchlistCount");
  if (!table) return;

  const rows = watchlist.map((stock, index) => enrich(normalizeWatchlistRow(stock), index)).sort((a, b) => compareBySort(a, b, watchlistSortState));
  table.innerHTML = "";
  if (count) count.textContent = `${rows.length}件`;

  if (rows.length === 0) {
    table.innerHTML = `<tr><td class="empty-row" colspan="8">検討中銘柄はまだありません。</td></tr>`;
    return;
  }

  rows.forEach((stock) => {
    logYahoo8593WatchlistRenderDebug(stock);
    const row = document.createElement("tr");
    row.dataset.rowKey = getRowSelectionKey(stock);
    row.innerHTML = `
      <td>${stock.code || "-"}</td>
      <td>${renderResearchName(stock)}</td>
      <td>${formatNumber(stock.current)}</td>
      <td class="${dayChangeToneClass(stock.dayChange)}">${formatSignedNumber(stock.dayChange)}</td>
      <td class="${dayChangeToneClass(stock.dayChangePct)}">${formatSignedPercent(stock.dayChangePct)}</td>
      <td>${formatNumber(stock.dividend)}</td>
      <td>${formatPercent(stock.currentYield)}</td>
      <td>${stock.memo || "-"}</td>
    `;
    applyRowSelectionState(row, "watchlist");
    table.append(row);
  });
}

function logYahoo8593WatchlistRenderDebug(stock) {
  if (String(stock?.code) !== "8593") return;
  console.log("[dividend-manager] 8593 watchlist render row", stock);
  console.log("[dividend-manager] 8593 render current", stock.current);
  console.log("[dividend-manager] 8593 render dayChange", stock.dayChange);
  console.log("[dividend-manager] 8593 render dayChangePct", stock.dayChangePct);
  console.log("[dividend-manager] 8593 render dividend", stock.dividend);
  console.log("[dividend-manager] 8593 render dividendYield", stock.dividendYield);
  console.log("[dividend-manager] 8593 render currentYield", stock.currentYield);
}

function normalizeWatchlistRow(stock) {
  return {
    assetClass: "日本株",
    dividendStatus: Number.isFinite(toNumber(stock.dividend)) ? "集計対象" : "未入力",
    qty: null,
    buy: null,
    ...stock,
    memo: stock.memo || "検討中",
  };
}

function renderDailyDecliners(enrichedStocks) {
  const table = document.querySelector("#dailyDeclinersTable");
  const count = document.querySelector("#dailyDeclinersCount");
  const dividendOnly = document.querySelector("#dailyDeclinersDividendOnly")?.checked ?? false;
  if (!table) return;

  const decliners = enrichedStocks
    .filter((stock) => {
      const isDown = safeFinite(stock.dayChangePct) < 0 || safeFinite(stock.dayChange) < 0;
      const hasDividend = safeFinite(stock.dividend) > 0;
      return isDown && (!dividendOnly || hasDividend);
    })
    .sort((a, b) => compareBySort(a, b, dailyDeclinersSortState));

  if (count) count.textContent = `${decliners.length}件`;
  table.innerHTML = "";

  if (decliners.length === 0) {
    table.innerHTML = `<tr><td class="empty-row" colspan="9">該当する保有銘柄はありません。</td></tr>`;
    return;
  }

  decliners.forEach((stock) => {
    const row = document.createElement("tr");
    row.dataset.rowKey = getRowSelectionKey(stock);
    row.innerHTML = `
      <td>${stock.code || "-"}</td>
      <td>${renderResearchName(stock)}</td>
      <td class="${numberToneClass(stock.gainLossPct)}">${formatSignedPercent(stock.gainLossPct)}</td>
      <td class="${dayChangeToneClass(stock.dayChangePct)}">${formatSignedPercent(stock.dayChangePct)}</td>
      <td>${formatNumber(stock.current)}</td>
      <td>${formatNumber(stock.buy)}</td>
      <td class="${dayChangeToneClass(stock.dayChange)}">${formatSignedNumber(stock.dayChange)}</td>
      <td>${formatNumber(stock.qty)}</td>
      <td>${formatYenPrecise(stock.currentValue)}</td>
    `;
    applyRowSelectionState(row, "dailyDecliners");
    table.append(row);
  });
}

function renderBuyCandidates(enrichedStocks) {
  const table = document.querySelector("#buyCandidateTable");
  if (!table) return;

  const scoredCandidates = enrichedStocks
    .filter((stock) => safeFinite(stock.dividend) > 0 && safeFinite(stock.dayChangePct) < 0)
    .map((stock) => ({
      ...stock,
      buyCandidateScore: calculateBuyCandidateScore(stock, enrichedStocks),
      buyCandidateReasons: getBuyCandidateReasons(stock),
    }))
    .filter((stock) => stock.buyCandidateScore > 0)
    .sort((a, b) => b.buyCandidateScore - a.buyCandidateScore || safeFinite(a.dayChangePct) - safeFinite(b.dayChangePct))
    .map((stock, index) => ({ ...stock, rank: index + 1, buyCandidateReasonsText: stock.buyCandidateReasons.join(" / ") }));

  const candidates = scoredCandidates
    .sort((a, b) => compareBySort(a, b, buyCandidateSortState) || a.rank - b.rank)
    .slice(0, 10);

  table.innerHTML = "";

  if (candidates.length === 0) {
    table.innerHTML = `<tr><td class="empty-row" colspan="11">逆張り買い増し候補はありません。</td></tr>`;
    return;
  }

  candidates.forEach((stock) => {
    const row = document.createElement("tr");
    row.dataset.rowKey = getRowSelectionKey(stock);
    row.innerHTML = `
      <td>${stock.code || "-"}</td>
      <td>${renderResearchName(stock)}</td>
      <td>${formatNumber(stock.buy)}</td>
      <td>${formatNumber(stock.current)}</td>
      <td class="${dayChangeToneClass(stock.dayChangePct)}">${formatSignedPercent(stock.dayChangePct)}</td>
      <td class="${numberToneClass(stock.gainLossPct)}">${formatSignedPercent(stock.gainLossPct)}</td>
      <td>${formatPercent(stock.currentYield)}</td>
      <td><strong>${stock.buyCandidateScore.toFixed(1)}</strong></td>
      <td>${formatYenPrecise(stock.currentValue)}</td>
      <td>${displayDividendStatus(stock.dividendStatus)}</td>
      <td>${stock.buyCandidateReasonsText}</td>
    `;
    applyRowSelectionState(row, "buyCandidates");
    table.append(row);
  });
}

function calculateBuyCandidateScore(stock, allStocks) {
  const prices = allStocks.map((item) => safeFinite(item.current)).filter((value) => value > 0);
  const maxPrice = Math.max(...prices, 1);
  const dayChangePct = safeFinite(stock.dayChangePct);
  const current = safeFinite(stock.current);
  const gainLoss = safeFinite(stock.gainLossAmount ?? stock.gainLoss);
  const gainLossPct = safeFinite(stock.gainLossPct);
  let score = 0;

  if (dayChangePct >= 0) return 0;

  score += Math.min(Math.abs(dayChangePct) * 4, 24);
  if (dayChangePct <= -3) score += 35;
  if (dayChangePct <= -5) score += 20;

  if (gainLoss < 0 || gainLossPct < 0) {
    score += 18;
    score += Math.min(Math.abs(Math.min(gainLossPct, 0)) * 1.8, 32);
  } else {
    score -= Math.min(gainLossPct * 1.5, 25);
  }

  score += Math.max(0, (1 - current / maxPrice) * 10);
  score += 8;

  return score;
}

function getBuyCandidateReasons(stock) {
  const reasons = [`前日比 ${formatSignedPercent(stock.dayChangePct)}`];
  const gainLossPct = safeFinite(stock.gainLossPct);
  const current = safeFinite(stock.current);

  if (gainLossPct < 0) {
    reasons.push(`含み損 ${formatSignedPercent(gainLossPct)}`);
  } else if (gainLossPct > 0) {
    reasons.push(`含み益 ${formatSignedPercent(gainLossPct)}`);
  }

  reasons.push("配当あり");
  if (current > 0) reasons.push(`現在値 ${formatNumber(current)}`);
  return reasons;
}

function renderDividendPlan(enrichedStocks) {
  const annualGrossElement = document.querySelector("#dividendPlanAnnualGross");
  if (!annualGrossElement) return;

  const plan = calculateDividendPlan(enrichedStocks);
  const previousAnnual = getPreviousSavedAnnualDividend();
  const delta = Number.isFinite(previousAnnual) ? plan.totalGrossYen - previousAnnual : null;
  const deltaPct = Number.isFinite(delta) && previousAnnual > 0 ? (delta / previousAnnual) * 100 : null;

  annualGrossElement.textContent = formatYenPrecise(plan.totalGrossYen);
  document.querySelector("#dividendPlanMonthlyGross").textContent = formatYenPrecise(plan.totalGrossYen / 12);
  document.querySelector("#dividendPlanAnnualNet").textContent = formatYenPrecise(plan.totalNetYen);
  document.querySelector("#dividendPlanPreviousDelta").textContent =
    delta === null ? "前回比 -" : `前回比 ${formatSignedYen(delta)} ${Number.isFinite(deltaPct) ? `(${formatSignedPercent(deltaPct)})` : ""}`;
  document.querySelector("#dividendPlanCurrencyNote").textContent =
    plan.usdGross > 0 ? `税引前 / 米国ETF未換算 ${formatDollar(plan.usdGross)}` : "税引前";
  document.querySelector("#dividendPlanTaxNote").textContent =
    plan.hasNisa || plan.hasTaxable
      ? "NISAは非課税、課税口座は20.315%で概算"
      : "口座区分がないため課税口座として概算";
}

function calculateDividendPlan(enrichedStocks) {
  const TAX_RATE = 0.20315;
  return enrichedStocks.reduce(
    (plan, stock) => {
      const dividend = safeFinite(stock.dividend);
      const qty = safeFinite(stock.qty);
      if (dividend <= 0 || qty <= 0) return plan;

      const annual = dividend * qty;
      const fxRate = inferFxRate(stock);
      const annualYen = stock.currency === "USD" && fxRate ? annual * fxRate : stock.currency === "USD" ? 0 : annual;
      const annualUsd = stock.currency === "USD" && !fxRate ? annual : 0;
      const isNisa = isNisaHolding(stock);

      plan.totalGrossYen += annualYen;
      plan.totalNetYen += isNisa ? annualYen : annualYen * (1 - TAX_RATE);
      plan.usdGross += annualUsd;
      plan.hasNisa = plan.hasNisa || isNisa;
      plan.hasTaxable = plan.hasTaxable || !isNisa;
      return plan;
    },
    { totalGrossYen: 0, totalNetYen: 0, usdGross: 0, hasNisa: false, hasTaxable: false },
  );
}

function inferFxRate(stock) {
  const explicit = safeFinite(stock.fxRate || stock.exchangeRate || stock.usdJpy);
  if (explicit > 0) return explicit;
  const marketValue = safeFinite(stock.currentValue);
  const current = safeFinite(stock.current);
  const qty = safeFinite(stock.qty);
  if (marketValue > 0 && current > 0 && qty > 0) return marketValue / (current * qty);
  return null;
}

function isNisaHolding(stock) {
  const label = [stock.account, stock.accountType, stock.depositType, stock.taxType, stock.memo, stock.note]
    .map((value) => String(value || ""))
    .join(" ");
  return /NISA|ニーサ|新NISA|つみたて|成長投資/i.test(label);
}

function getPreviousSavedAnnualDividend() {
  const snapshots = storageService.loadPortfolioSnapshots();
  if (!Array.isArray(snapshots) || snapshots.length === 0) return null;
  const sorted = [...snapshots]
    .filter((snapshot) => Number.isFinite(Number(snapshot.annualDividend)))
    .sort((a, b) => String(b.createdAt || b.snapshotDate || "").localeCompare(String(a.createdAt || a.snapshotDate || "")));
  return sorted[0] ? Number(sorted[0].annualDividend) : null;
}

function safeFinite(value) {
  const number = toNumber(value);
  return Number.isFinite(number) ? number : 0;
}

function formatDollar(value) {
  return `$${numberDecimal.format(safeFinite(value))}`;
}

function canOpenResearchMenu(stock) {
  return stock?.assetClass === "日本株" && /^\d{4}$/.test(String(stock.code || ""));
}

function renderResearchName(stock) {
  const name = stock.name || "-";
  if (!canOpenResearchMenu(stock)) return escapeHtml(name);
  return `
    <button
      class="research-name-button"
      type="button"
      data-research-code="${escapeAttr(stock.code)}"
      data-research-name="${escapeAttr(name)}"
      aria-haspopup="true"
      aria-expanded="false"
    >${escapeHtml(name)}</button>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function handleResearchMenuDocumentClick(event) {
  const button = event.target.closest(".research-name-button");
  if (button) {
    event.preventDefault();
    event.stopPropagation();
    openResearchMenu(button);
    return;
  }

  const menu = document.querySelector("#stockResearchMenu");
  if (menu && !menu.contains(event.target)) {
    closeResearchMenu();
  }
}

function openResearchMenu(button) {
  const code = button.dataset.researchCode;
  const name = button.dataset.researchName;
  if (!code || !name) return;

  document.querySelectorAll(".research-name-button[aria-expanded='true']").forEach((item) => {
    item.setAttribute("aria-expanded", "false");
  });
  button.setAttribute("aria-expanded", "true");

  const menu = getResearchMenuElement();
  menu.innerHTML = `
    <div class="research-menu-title">
      <strong>${escapeHtml(name)}</strong>
      <span>${escapeHtml(code)}</span>
    </div>
    <div class="research-menu-actions">
      ${RESEARCH_LINKS.map(
        (link) =>
          `<a href="${escapeAttr(link.url(code))}" target="_blank" rel="noopener noreferrer" data-research-site="${link.id}">${escapeHtml(link.label)}</a>`,
      ).join("")}
    </div>
  `;
  menu.classList.add("is-visible");
  positionResearchMenu(menu, button);
}

function getResearchMenuElement() {
  let menu = document.querySelector("#stockResearchMenu");
  if (menu) return menu;
  menu = document.createElement("div");
  menu.id = "stockResearchMenu";
  menu.className = "research-menu";
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-label", "銘柄調査メニュー");
  document.body.append(menu);
  return menu;
}

function positionResearchMenu(menu, button) {
  const margin = 10;
  const buttonRect = button.getBoundingClientRect();
  menu.style.left = "0px";
  menu.style.top = "0px";
  const menuRect = menu.getBoundingClientRect();
  const left = Math.min(Math.max(buttonRect.left, margin), window.innerWidth - menuRect.width - margin);
  const belowTop = buttonRect.bottom + 8;
  const aboveTop = buttonRect.top - menuRect.height - 8;
  const top = belowTop + menuRect.height + margin <= window.innerHeight ? belowTop : Math.max(aboveTop, margin);
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function closeResearchMenu() {
  const menu = document.querySelector("#stockResearchMenu");
  if (menu) menu.classList.remove("is-visible");
  document.querySelectorAll(".research-name-button[aria-expanded='true']").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function handleResearchMenuKeydown(event) {
  if (event.key === "Escape") {
    closeResearchMenu();
  }
}

function getAllocationStocks(enrichedStocks) {
  return [...enrichedStocks, ...excludedStocks.map((stock, index) => enrich(stock, -100 - index))];
}

function getInsightStocks(allocationStocks, coveredStocks) {
  if (currentViewMode === "usEtf") {
    return allocationStocks.filter((stock) => stock.assetClass === "米国ETF");
  }
  if (currentViewMode === "dividends") {
    return coveredStocks;
  }
  return allocationStocks;
}

function getSummaryRows({
  allocationStocks,
  covered,
  totalAssetValue,
  totalCostValue,
  totalGainLoss,
  totalDividend,
  yieldOnCost,
  fundStocks,
  fundValue,
  fundCost,
  fundGain,
}) {
  let rows = allocationStocks;
  let dividend = totalDividend;
  let dividendCost = covered.reduce((sum, stock) => sum + (stock.costValue ?? 0), 0);

  if (currentViewMode === "dividends") {
    rows = covered;
  }

  if (currentViewMode === "usEtf") {
    rows = allocationStocks.filter((stock) => stock.assetClass === "米国ETF");
    dividend = rows.reduce((sum, stock) => sum + (stock.annualDividend ?? 0), 0);
    dividendCost = rows.reduce((sum, stock) => sum + (stock.costValue ?? 0), 0);
  }

  if (currentViewMode === "funds") {
    rows = fundStocks;
    dividend = 0;
    dividendCost = 0;
  }

  const value = currentViewMode === "assets" ? totalAssetValue : rows.reduce((sum, stock) => sum + (stock.currentValue ?? 0), 0);
  const cost = currentViewMode === "assets" ? totalCostValue : rows.reduce((sum, stock) => sum + (stock.costValue ?? 0), 0);
  const gain = currentViewMode === "assets" ? totalGainLoss : currentViewMode === "funds" ? fundGain : value - cost;
  const dividendYield = dividendCost > 0 ? (dividend / dividendCost) * 100 : 0;
  const isAssetsView = currentViewMode === "assets";

  return {
    value: { label: isAssetsView ? "総評価額" : "評価額", value: formatYenPrecise(value), note: `${rows.length}件` },
    cost: { label: isAssetsView ? "総取得額" : "取得額", value: formatYenPrecise(cost), note: "取得金額合計" },
    gain: { label: "含み損益", value: formatSignedYen(gain), note: "評価損益", tone: gain },
    dividend: { label: "年間配当", value: formatYenPrecise(dividend), note: currentViewMode === "funds" ? "集計なし" : "税引前" },
    yield: { label: "取得利回り", value: formatPercent(dividendYield), note: "購入価格ベース", tone: dividendYield },
  };
}

function renderSummaryCard(labelSelector, valueSelector, noteSelector, row) {
  if (labelSelector) document.querySelector(labelSelector).textContent = row.label;
  const valueElement = document.querySelector(valueSelector);
  valueElement.textContent = row.value;
  applyTone(valueElement, row.tone);
  if (noteSelector) document.querySelector(noteSelector).textContent = row.note;
}

function renderDividendGoalCard({ allocationStocks, covered, yieldOnCost }) {
  const monthlyInput = document.querySelector("#goalMonthlyDividendInput");
  const stockCountInput = document.querySelector("#goalStockCountInput");
  const dividendYieldInput = document.querySelector("#goalDividendYieldInput");
  const marketValueInput = document.querySelector("#goalMarketValueInput");
  if (!monthlyInput || !stockCountInput || !dividendYieldInput || !marketValueInput) return;

  monthlyInput.value = Number.isFinite(dividendGoal.monthlyDividend) ? String(Math.round(dividendGoal.monthlyDividend)) : "";
  stockCountInput.value = Number.isFinite(dividendGoal.stockCount) ? String(Math.round(dividendGoal.stockCount)) : "";
  dividendYieldInput.value = Number.isFinite(dividendGoal.dividendYield) ? String(dividendGoal.dividendYield) : "3.5";
  marketValueInput.value = Number.isFinite(dividendGoal.marketValueTarget) ? String(Math.round(dividendGoal.marketValueTarget)) : "10000";

  const dividendStocks = allocationStocks.filter((stock) => isDividendPortfolioAsset(stock));
  const actualMonthlyDividend = covered.reduce((sum, stock) => sum + (stock.annualDividend ?? 0), 0) / 12;
  const actualAnnualDividend = covered.reduce((sum, stock) => sum + (stock.annualDividend ?? 0), 0);
  const actualStockCount = dividendStocks.length;
  const actualCost = dividendStocks.reduce((sum, stock) => sum + (stock.costValue ?? 0), 0);
  const actualAverageCost = actualStockCount > 0 ? actualCost / actualStockCount : 0;
  const targetMonthlyDividend = dividendGoal.monthlyDividend;
  const targetStockCount = dividendGoal.stockCount;
  const targetDividendYield = dividendGoal.dividendYield;
  const targetAnnualDividend = Number.isFinite(targetMonthlyDividend) ? targetMonthlyDividend * 12 : null;
  const targetCost =
    Number.isFinite(targetAnnualDividend) && targetAnnualDividend > 0 && Number.isFinite(targetDividendYield) && targetDividendYield > 0
      ? (targetAnnualDividend * 100) / targetDividendYield
      : null;
  const targetAverageCost =
    Number.isFinite(targetCost) && Number.isFinite(targetStockCount) && targetStockCount > 0 ? targetCost / targetStockCount : null;
  const underTargetCount = dividendStocks.filter((stock) => isMarketValueUnderTarget(stock.currentValue)).length;

  setGoalMetric("#goalAnnualDividendTarget", Number.isFinite(targetAnnualDividend) ? formatYenPrecise(targetAnnualDividend) : "-");
  setGoalMetric("#goalCostTarget", Number.isFinite(targetCost) ? formatYenPrecise(targetCost) : "-");
  setGoalMetric("#goalAverageCostTarget", Number.isFinite(targetAverageCost) ? formatYenPrecise(targetAverageCost) : "-");

  setGoalDiff("#goalMonthlyDividendDiff", actualMonthlyDividend, targetMonthlyDividend, formatSignedYen);
  setGoalDiff("#goalStockCountDiff", actualStockCount, targetStockCount, formatSignedNumber);
  setGoalDiff("#goalDividendYieldDiff", yieldOnCost, targetDividendYield, formatSignedPercent);
  setGoalDiff("#goalAnnualDividendDiff", actualAnnualDividend, targetAnnualDividend, formatSignedYen);
  setGoalDiff("#goalCostDiff", actualCost, targetCost, formatSignedYen);
  setGoalDiff("#goalAverageCostDiff", actualAverageCost, targetAverageCost, formatSignedYen);
  setGoalCountDiff("#goalMarketValueDiff", underTargetCount);
}

function setGoalMetric(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

function setGoalDiff(selector, actualValue, targetValue, formatter) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.classList.remove("is-negative", "is-positive");
  if (!Number.isFinite(targetValue)) {
    element.textContent = "-";
    return;
  }
  const diff = actualValue - targetValue;
  element.textContent = formatter(diff);
  applyTone(element, diff);
}

function setGoalCountDiff(selector, count) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.classList.remove("is-negative", "is-positive");
  element.textContent = `${formatNumber(count)}銘柄`;
  if (count > 0) element.classList.add("is-negative");
}

function isMarketValueUnderTarget(value) {
  return Number.isFinite(value) && Number.isFinite(dividendGoal.marketValueTarget) && value < dividendGoal.marketValueTarget;
}

function isDividendAllocationStock(stock) {
  return stock.assetClass === "日本株" || stock.assetClass === "ETF" || stock.assetClass === "米国ETF" || stock.type === "ETF";
}

function renderRanking(selector, rows, field, detailFormatter) {
  const list = document.querySelector(selector);
  list.innerHTML = "";
  rows
    .filter((stock) => Number.isFinite(stock[field]))
    .sort((a, b) => b[field] - a[field])
    .slice(0, 5)
    .forEach((stock) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${stock.code} ${stock.name}</strong><span>${detailFormatter(stock)}</span>`;
      list.append(item);
    });
}

function renderMissing(missing) {
  const list = document.querySelector("#missingDividendList");
  list.innerHTML = "";
  if (missing.length === 0) {
    const item = document.createElement("li");
    item.textContent = "未入力はありません";
    list.append(item);
    return;
  }
  missing.forEach((stock) => {
    const item = document.createElement("li");
    item.textContent = `${stock.code} ${stock.name}`;
    list.append(item);
  });
}

function renderSectorChart(enrichedStocks) {
  const chart = document.querySelector("#sectorStackChart");
  const legend = document.querySelector("#sectorLegend");
  const sectorTotals = new Map();

  enrichedStocks.forEach((stock) => {
    if (!Number.isFinite(stock.currentValue)) return;
    const sector = stock.sector || "未分類";
    sectorTotals.set(sector, (sectorTotals.get(sector) ?? 0) + stock.currentValue);
  });

  const sectors = [...sectorTotals.entries()]
    .map(([sector, value]) => ({ sector, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = sectors.reduce((sum, item) => sum + item.value, 0);

  legend.innerHTML = "";
  chart.innerHTML = "";

  if (total === 0) {
    chart.removeAttribute("style");
    chart.setAttribute("aria-label", "業種別の評価額構成比はまだありません");
    const item = document.createElement("li");
    item.textContent = "データがありません";
    legend.append(item);
    return;
  }

  sectors.forEach((item, index) => {
    const percent = (item.value / total) * 100;
    const color = getSectorColor(item.sector);
    const segment = document.createElement("div");
    segment.className = "sector-stack-segment";
    segment.style.height = `${percent}%`;
    segment.style.background = color;
    segment.title = `${item.sector}: ${percent.toFixed(1)}%`;
    chart.append(segment);
  });

  chart.setAttribute(
    "aria-label",
    `業種別の評価額構成比。最大は${sectors[0].sector}で${((sectors[0].value / total) * 100).toFixed(1)}%です`,
  );

  sectors.slice(0, 8).forEach((item, index) => {
    const percent = (item.value / total) * 100;
    const legendItem = document.createElement("li");
    legendItem.innerHTML = `
      <span class="sector-swatch" style="background:${getSectorColor(item.sector)}"></span>
      <strong>${item.sector}</strong>
      <span>${percent.toFixed(1)}% / ${formatYenPrecise(item.value)}</span>
    `;
    legend.append(legendItem);
  });
}

function getSectorColor(sector) {
  const allocationStocks = getAllocationStocks(stocks.map((stock, index) => enrich(stock, index)));
  const sectorTotals = new Map();
  allocationStocks.forEach((stock) => {
    if (!Number.isFinite(stock.currentValue)) return;
    const stockSector = stock.sector || "未分類";
    sectorTotals.set(stockSector, (sectorTotals.get(stockSector) ?? 0) + stock.currentValue);
  });
  const sectors = [...sectorTotals.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  const index = sectors.findIndex((item) => item.name === sector);
  return index >= 0 ? sectorColors[index % sectorColors.length] : "#c8dce3";
}

function renderTypeChart(enrichedStocks) {
  const chart = document.querySelector("#typePieChart");
  const legend = document.querySelector("#typeLegend");
  const typeTotals = new Map();

  enrichedStocks.forEach((stock) => {
    if (!Number.isFinite(stock.currentValue)) return;
    const type = stock.type === "ETF" ? "ETF" : sectorTypeMap[stock.sector] ?? "未分類";
    typeTotals.set(type, (typeTotals.get(type) ?? 0) + stock.currentValue);
  });

  const types = [...typeTotals.entries()]
    .map(([type, value]) => ({ type, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = types.reduce((sum, item) => sum + item.value, 0);

  legend.innerHTML = "";

  if (total === 0) {
    chart.style.background = "var(--panel-strong)";
    chart.setAttribute("aria-label", "銘柄タイプ別の評価額構成比はまだありません");
    const item = document.createElement("li");
    item.textContent = "データがありません";
    legend.append(item);
    return;
  }

  let cursor = 0;
  const gradientStops = types.map((item) => {
    const start = cursor;
    const end = cursor + (item.value / total) * 100;
    cursor = end;
    return `${typeColors[item.type]} ${start.toFixed(3)}% ${end.toFixed(3)}%`;
  });

  chart.style.background = `conic-gradient(${gradientStops.join(", ")})`;
  chart.setAttribute(
    "aria-label",
    `ディフェンシブ株と景気敏感株の評価額構成比。最大は${types[0].type}で${((types[0].value / total) * 100).toFixed(1)}%です`,
  );

  types.forEach((item) => {
    const percent = (item.value / total) * 100;
    const legendItem = document.createElement("li");
    legendItem.innerHTML = `
      <span class="type-swatch" style="background:${typeColors[item.type]}"></span>
      <strong>${item.type}</strong>
      <span>${percent.toFixed(1)}% / ${formatYenPrecise(item.value)}</span>
    `;
    legend.append(legendItem);
  });
}

function renderAssetClassChart(enrichedStocks) {
  renderBreakdownPie({
    rows: enrichedStocks,
    chartSelector: "#assetPieChart",
    legendSelector: "#assetLegend",
    keyGetter: (stock) => stock.assetClass || "その他",
    colors: assetColors,
    fallbackColor: "#d8e2b3",
    label: "資産種別",
  });
}

function renderDividendStatusChart(enrichedStocks) {
  renderBreakdownPie({
    rows: enrichedStocks,
    chartSelector: "#dividendStatusPieChart",
    legendSelector: "#dividendStatusLegend",
    keyGetter: (stock) => displayDividendStatus(stock.dividendStatus),
    colors: dividendStatusColors,
    fallbackColor: "#d8e2b3",
    label: "配当区分",
  });
}

function renderBreakdownPie({ rows, chartSelector, legendSelector, keyGetter, colors, fallbackColor, label }) {
  const chart = document.querySelector(chartSelector);
  const legend = document.querySelector(legendSelector);
  const totals = new Map();

  rows.forEach((stock) => {
    if (!Number.isFinite(stock.currentValue)) return;
    const key = keyGetter(stock);
    totals.set(key, (totals.get(key) ?? 0) + stock.currentValue);
  });

  const items = [...totals.entries()]
    .map(([key, value]) => ({ key, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  legend.innerHTML = "";

  if (total === 0) {
    chart.style.background = "var(--panel-strong)";
    chart.setAttribute("aria-label", `${label}の評価額構成比はまだありません`);
    const item = document.createElement("li");
    item.textContent = "データがありません";
    legend.append(item);
    return;
  }

  let cursor = 0;
  const gradientStops = items.map((item) => {
    const start = cursor;
    const end = cursor + (item.value / total) * 100;
    cursor = end;
    return `${colors[item.key] ?? fallbackColor} ${start.toFixed(3)}% ${end.toFixed(3)}%`;
  });

  chart.style.background = `conic-gradient(${gradientStops.join(", ")})`;
  chart.setAttribute("aria-label", `${label}の評価額構成比。最大は${items[0].key}で${((items[0].value / total) * 100).toFixed(1)}%です`);

  items.forEach((item) => {
    const percent = (item.value / total) * 100;
    const legendItem = document.createElement("li");
    legendItem.innerHTML = `
      <span class="type-swatch" style="background:${colors[item.key] ?? fallbackColor}"></span>
      <strong>${item.key}</strong>
      <span>${percent.toFixed(1)}% / ${formatYenPrecise(item.value)}</span>
    `;
    legend.append(legendItem);
  });
}

function handleInputChange(event) {
  const row = event.target.closest("tr");
  const index = Number(row.dataset.index);
  const field = event.target.dataset.field;
  const numericFields = new Set(["current", "dayChange", "dayChangePct", "buy", "qty", "dividend"]);
  const nextValue = numericFields.has(field) ? toNumber(event.target.value) : event.target.value.trim();
  const normalizedValue = field === "dividendStatus" ? normalizeDividendStatusValue(nextValue) : nextValue;
  if (stocks[index][field] === normalizedValue) return;
  rememberState();
  stocks[index][field] = normalizedValue;
  saveStocks();
  render();
}

function handleInputFocus(event) {
  const field = event.target.dataset.field;
  if (!["current", "dayChange", "dayChangePct", "buy", "qty", "dividend"].includes(field)) return;
  event.target.value = event.target.value.replace("+", "").replace("%", "").replaceAll(",", "");
  event.target.select();
}

function formatInputValue(field, value) {
  if (field === "dividendStatus") return displayDividendStatus(value);
  if (field === "sector") return displaySector(value);
  if (field === "dayChange") return Number.isFinite(toNumber(value)) ? formatSignedNumber(toNumber(value)) : "";
  if (field === "dayChangePct") return Number.isFinite(toNumber(value)) ? formatSignedPercent(toNumber(value)) : "";
  if (["current", "buy", "qty", "dividend"].includes(field)) {
    return Number.isFinite(toNumber(value)) ? formatNumber(toNumber(value)) : "";
  }
  return value ?? "";
}

function displaySector(sector) {
  return sector || "未分類";
}

function isDayChangeField(field) {
  return field === "dayChange" || field === "dayChangePct";
}

function clearAllData() {
  const ok = confirm("登録済みの保有データをすべて削除します。実行しますか？");
  if (!ok) return;

  rememberState();
  stocks = [];
  excludedStocks = [];
  importRows = [];
  dividendGoal = { monthlyDividend: null, stockCount: null, dividendYield: 3.5, marketValueTarget: 10000 };
  saveStocks();
  saveExcludedStocks();
  saveDividendGoal();
  storageService.savePortfolioSnapshots([]);
  storageService.markSeedDone(FUND_SEED_KEY);
  storageService.markSeedDone(US_ETF_SEED_KEY);
  document.querySelector("#importText").value = "";
  document.querySelector("#importPreviewTable").innerHTML = "";
  document.querySelector("#importStatus").textContent = "まだデータは読み込まれていません。";
  document.querySelector("#csvFileInput").value = "";
  render();
}

function updateDividendGoal(field, value) {
  const parsed = toNumber(value);
  if (field === "dividendYield") {
    dividendGoal[field] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 3.5;
  } else if (field === "marketValueTarget") {
    dividendGoal[field] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 10000;
  } else {
    dividendGoal[field] = Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  saveDividendGoal();
  render();
}

function exportCsv() {
  const headers = [
    "種別",
    "コード",
    "名称",
    "業種/カテゴリ",
    "評価額",
    "配当利回り",
    "取得利回り",
    "損益",
    "損益率",
    "保有数",
    "1株配当",
    "購入価格",
    "現在値",
    "前日比",
    "前日比%",
    "取得額",
    "配当区分",
    "年間配当",
  ];
  const lines = [
    headers,
    ...stocks.map((stock, index) => {
      const row = enrich(stock, index);
      return [
        row.assetClass,
        row.code,
        row.name,
        displaySector(row.sector),
        row.currentValue,
        row.currentYield,
        row.yieldOnCost,
        row.gainLoss,
        row.gainLossPct,
        row.qty,
        row.dividend,
        row.buy,
        row.current,
        row.dayChange,
        row.dayChangePct,
        row.costValue,
        displayDividendStatus(row.dividendStatus),
        row.annualDividend,
      ];
    }),
  ];
  const csv = lines.map((line) => line.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dividend-portfolio.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = value ?? "";
  const escaped = String(text).replaceAll('"', '""');
  return `"${escaped}"`;
}

function setupSortHeaders() {
  document.querySelectorAll("th[data-sort]").forEach((header) => {
    header.tabIndex = 0;
    header.role = "button";
    header.addEventListener("click", (event) => {
      if (shouldSuppressSortClick(event)) return;
      changeSort(header.dataset.sort);
    });
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        changeSort(header.dataset.sort);
      }
    });
  });
  document.querySelectorAll("th[data-excluded-sort]").forEach((header) => {
    header.tabIndex = 0;
    header.role = "button";
    header.addEventListener("click", (event) => {
      if (shouldSuppressSortClick(event)) return;
      changeExcludedSort(header.dataset.excludedSort);
    });
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        changeExcludedSort(header.dataset.excludedSort);
      }
    });
  });
  document.querySelectorAll("th[data-daily-sort]").forEach((header) => {
    header.tabIndex = 0;
    header.role = "button";
    header.addEventListener("click", (event) => {
      if (shouldSuppressSortClick(event)) return;
      changeDailySort(header.dataset.dailyTable, header.dataset.dailySort);
    });
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        changeDailySort(header.dataset.dailyTable, header.dataset.dailySort);
      }
    });
  });
  document.querySelectorAll("th[data-watchlist-sort]").forEach((header) => {
    header.tabIndex = 0;
    header.role = "button";
    header.addEventListener("click", (event) => {
      if (shouldSuppressSortClick(event)) return;
      changeWatchlistSort(header.dataset.watchlistSort);
    });
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        changeWatchlistSort(header.dataset.watchlistSort);
      }
    });
  });
}

function setupColumnResizers() {
  getResizableTables().forEach(({ table, tableKey }) => {
    const headers = [...table.querySelectorAll("thead th")];
    const savedWidths = loadColumnWidths(tableKey);
    table.style.tableLayout = "fixed";

    headers.forEach((header, columnIndex) => {
      header.classList.add("is-resizable");
      const width = savedWidths[columnIndex] || getDefaultColumnWidth(tableKey, columnIndex);
      setColumnWidth(table, columnIndex, width);
      if (header.querySelector(".column-resizer")) return;

      const handle = document.createElement("span");
      handle.className = "column-resizer";
      handle.setAttribute("aria-hidden", "true");
      handle.addEventListener("mousedown", (event) => startColumnResize(event, table, tableKey, columnIndex));
      handle.addEventListener("click", stopColumnResizeSort);
      handle.addEventListener("dblclick", (event) => autoFitColumn(event, table, tableKey, columnIndex));
      header.append(handle);
    });
  });
}

function getResizableTables() {
  const portfolioTables = [...document.querySelectorAll(".table-wrap table")].map((table, tableIndex) => ({
    table,
    tableKey: tableIndex === 0 ? "main" : "excluded",
  }));
  const dailyTables = [...document.querySelectorAll(".daily-dashboard table[data-column-key], .watchlist-section table[data-column-key]")].map((table) => ({
    table,
    tableKey: table.dataset.columnKey,
  }));
  return [...portfolioTables, ...dailyTables];
}

function getDefaultColumnWidth(tableKey, columnIndex) {
  return DAILY_COLUMN_WIDTHS[tableKey]?.[columnIndex] || DEFAULT_COLUMN_WIDTHS[columnIndex] || 96;
}

function stopColumnResizeSort(event) {
  event.preventDefault();
  event.stopPropagation();
}

function shouldSuppressSortClick(event) {
  if (event.target.closest(".column-resizer") || Date.now() < suppressSortClickUntil || suppressNextSortClick) {
    suppressNextSortClick = false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  return false;
}

function setupTableScrollSync() {
  document.querySelectorAll(".table-wrap").forEach((wrap) => {
    let topScroll = wrap.querySelector(":scope > .table-top-scroll");
    let tableScroll = wrap.querySelector(":scope > .table-scroll");
    const excludedSection = wrap.querySelector(".excluded-section");

    if (tableScroll && excludedSection && tableScroll.contains(excludedSection)) {
      wrap.append(excludedSection);
    }

    if (!topScroll) {
      topScroll = document.createElement("div");
      topScroll.className = "table-top-scroll";
      topScroll.innerHTML = '<div class="table-top-scroll-inner"></div>';
      wrap.prepend(topScroll);
    }

    if (!tableScroll) {
      tableScroll = document.createElement("div");
      tableScroll.className = "table-scroll";
      const mainTable = [...wrap.children].find((child) => child.tagName === "TABLE");
      if (!mainTable) return;
      mainTable.replaceWith(tableScroll);
      tableScroll.append(mainTable);
    }

    if (!topScroll.dataset.synced) {
      let isSyncing = false;
      topScroll.addEventListener("scroll", () => {
        if (isSyncing) return;
        isSyncing = true;
        tableScroll.scrollLeft = topScroll.scrollLeft;
        isSyncing = false;
      });
      tableScroll.addEventListener("scroll", () => {
        if (isSyncing) return;
        isSyncing = true;
        topScroll.scrollLeft = tableScroll.scrollLeft;
        isSyncing = false;
      });
      topScroll.dataset.synced = "true";
    }
  });
}

function updateTopScrollbars() {
  document.querySelectorAll(".table-wrap").forEach((wrap) => {
    const topInner = wrap.querySelector(".table-top-scroll-inner");
    const tableScroll = wrap.querySelector(".table-scroll");
    if (!topInner || !tableScroll) return;
    topInner.style.width = `${tableScroll.scrollWidth}px`;
  });
}

function loadColumnWidths(tableKey) {
  const parsed = loadUiSettings();
  return parsed[tableKey] || {};
}

function saveColumnWidth(tableKey, columnIndex, width) {
  const parsed = loadUiSettings();
  parsed[tableKey] = { ...(parsed[tableKey] || {}), [columnIndex]: width };
  saveUiSettings(parsed);
}

function saveColumnWidths(tableKey, widths) {
  const parsed = loadUiSettings();
  parsed[tableKey] = { ...(parsed[tableKey] || {}), ...widths };
  saveUiSettings(parsed);
}

function autoFitTablesToContent() {
  getResizableTables().forEach(({ table, tableKey }) => {
    const widths = calculateAutoColumnWidths(table);
    Object.entries(widths).forEach(([columnIndex, width]) => {
      setColumnWidth(table, Number(columnIndex), width);
    });
    saveColumnWidths(tableKey, widths);
  });
  updateTopScrollbars();
}

function calculateAutoColumnWidths(table, options = {}) {
  const widths = {};
  const headers = [...table.querySelectorAll("thead th")];
  headers.forEach((header, columnIndex) => {
    if (columnIndex === NAME_COLUMN_INDEX && !options.includeNameColumn) return;
    const values = [...table.querySelectorAll("tr")]
      .map((row) => row.children[columnIndex]?.textContent?.trim() ?? "")
      .filter(Boolean);
    const maxTextWidth = Math.max(...values.map((value) => measureTableText(value)), 0);
    const padding = columnIndex === SECTOR_COLUMN_INDEX ? 72 : 30;
    widths[columnIndex] = clampColumnWidth(columnIndex, Math.ceil(maxTextWidth + padding), table);
  });
  return widths;
}

function measureTableText(text) {
  if (!measureTableText.canvas) {
    measureTableText.canvas = document.createElement("canvas");
  }
  const context = measureTableText.canvas.getContext("2d");
  context.font = "700 13px 'Yu Gothic UI', 'Yu Gothic', Meiryo, sans-serif";
  return context.measureText(text).width;
}

function clampColumnWidth(columnIndex, width, table = null) {
  if (table?.dataset.columnKey) {
    const headerText = table.querySelectorAll("thead th")[columnIndex]?.textContent?.trim() || "";
    const minWidth = headerText === "順位" ? 44 : headerText === "コード" ? 58 : 72;
    const maxWidth = headerText === "銘柄名" || headerText === "理由" ? 520 : 180;
    return Math.min(Math.max(width, minWidth), maxWidth);
  }
  if (columnIndex === 0) return 38;
  if (columnIndex === 2) return 58;
  const minWidth = Math.max(44, DEFAULT_COLUMN_WIDTHS[columnIndex] ? Math.min(DEFAULT_COLUMN_WIDTHS[columnIndex], 96) : 72);
  if (columnIndex === NAME_COLUMN_INDEX) return Math.min(Math.max(width, 180), 520);
  const maxWidth = columnIndex === SECTOR_COLUMN_INDEX ? 360 : 180;
  return Math.min(Math.max(width, minWidth), maxWidth);
}

function autoFitColumn(event, table, tableKey, columnIndex) {
  event.preventDefault();
  event.stopPropagation();
  const width = calculateAutoColumnWidths(table, { includeNameColumn: true })[columnIndex];
  if (!width) return;
  setColumnWidth(table, columnIndex, width);
  saveColumnWidth(tableKey, columnIndex, width);
}

function startColumnResize(event, table, tableKey, columnIndex) {
  event.preventDefault();
  event.stopPropagation();

  const header = table.querySelectorAll("thead th")[columnIndex];
  const startX = event.clientX;
  const startWidth = header.getBoundingClientRect().width;
  let didResize = false;
  header.classList.add("is-resizing");
  document.body.classList.add("is-column-resizing");

  const handleMove = (moveEvent) => {
    if (Math.abs(moveEvent.clientX - startX) > 2) didResize = true;
    const nextWidth = Math.max(44, Math.round(startWidth + moveEvent.clientX - startX));
    setColumnWidth(table, columnIndex, nextWidth);
  };
  const handleUp = () => {
    const width = Math.round(header.getBoundingClientRect().width);
    suppressSortClickUntil = Date.now() + 1000;
    if (didResize) suppressNextSortClick = true;
    saveColumnWidth(tableKey, columnIndex, width);
    header.classList.remove("is-resizing");
    document.body.classList.remove("is-column-resizing");
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", handleUp);
  };

  window.addEventListener("mousemove", handleMove);
  window.addEventListener("mouseup", handleUp);
}

function setColumnWidth(table, columnIndex, width) {
  const rows = table.querySelectorAll("tr");
  rows.forEach((row) => {
    const cell = row.children[columnIndex];
    if (!cell) return;
    cell.style.width = `${width}px`;
    cell.style.minWidth = `${width}px`;
    cell.style.maxWidth = `${width}px`;
  });
  updateTableMinWidth(table);
}

function updateTableMinWidth(table) {
  const headers = [...table.querySelectorAll("thead th")];
  const width = headers.reduce((sum, header) => sum + header.getBoundingClientRect().width, 0);
  if (width > 0) {
    table.style.minWidth = `${Math.ceil(width)}px`;
    updateTopScrollbars();
  }
}

function setupTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      document.querySelectorAll(".tab-page").forEach((page) => {
        page.classList.toggle("is-active", page.id === button.dataset.tabTarget);
      });
      if (button.dataset.viewMode) {
        applyViewMode(button.dataset.viewMode);
      }
    });
  });
}

function applyViewMode(mode) {
  const config = viewModes[mode];
  if (!config) return;

  currentViewMode = mode;
  document.querySelector("#viewTitle").textContent = config.title;
  document.querySelector("#viewDescription").textContent = config.description;
  document.querySelector("#viewBadge").textContent = config.badge;
  renderAssetClassFilterOptions(config.assetClass);
  if ([...document.querySelector("#assetClassFilter").options].some((option) => option.value === config.assetClass)) {
    document.querySelector("#assetClassFilter").value = config.assetClass;
  }
  renderDividendStatusFilterOptions(config.dividendStatus);
  if (
    [...document.querySelector("#dividendStatusFilter").options].some((option) => option.value === config.dividendStatus)
  ) {
    document.querySelector("#dividendStatusFilter").value = config.dividendStatus;
  }
  document.querySelector("#dividendInsights").classList.toggle("is-hidden", !config.showDividendInsights);
  document.querySelector(".content-grid").classList.toggle("insights-hidden", !config.showDividendInsights);
  document.querySelector("#portfolioPage").classList.toggle("assets-view", mode === "assets");
  document.querySelector("#portfolioPage").classList.toggle("dividends-view", mode === "dividends");
  document.querySelector("#portfolioPage").classList.toggle("us-etf-view", mode === "usEtf");
  document.querySelector("#portfolioPage").classList.toggle("funds-view", mode === "funds");
  sortState = { ...config.sort };
  render();
}

function parseImportText(text) {
  const usEtfRows = parseUsEtfPortfolioRows(text);
  if (usEtfRows.length > 0) return logImportParseResult("US ETF", usEtfRows);

  const brokerRows = parseBrokerCsvRows(text);
  if (brokerRows.length > 0) return logImportParseResult("broker CSV", brokerRows);

  const tableRows = parseYahooTableRows(text);
  if (tableRows.length > 0) return logImportParseResult("Yahoo table", tableRows);

  const blockRows = parseYahooPortfolioBlocks(text);
  if (blockRows.length > 0) return logImportParseResult("Yahoo block", blockRows);

  return logImportParseResult(
    "line fallback",
    text
    .split(/\r?\n/)
    .map((line) => parseImportLine(line))
      .filter(Boolean),
  );
}

function logImportParseResult(source, rows) {
  const nextRows = rows.map((row) => addImportedHoldingMetrics(row));
  if (nextRows.some((row) => String(row.code) === "8593")) {
    console.log("[dividend-manager] 8593 import parser used", source);
  }
  return nextRows;
}

function addImportedHoldingMetrics(row) {
  const current = toNumber(row.current);
  const buy = toNumber(row.buy ?? row.purchasePrice);
  const qty = toNumber(row.qty);
  const marketValue = current !== null && qty !== null ? current * qty : null;
  const costAmount = buy !== null && qty !== null ? buy * qty : null;
  const gainLossAmount = marketValue !== null && costAmount !== null ? marketValue - costAmount : null;
  const gainLossPct = current !== null && buy !== null && buy !== 0 ? ((current - buy) / buy) * 100 : null;

  return {
    ...row,
    buy,
    purchasePrice: buy,
    qty,
    marketValue,
    costAmount,
    gainLossAmount,
    gainLossPct,
  };
}

function parseUsEtfPortfolioRows(text) {
  const lines = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.some((line) => line.includes("米国株式") || line.includes("外貨建評価") || line.includes("円換算評価額"))) {
    return [];
  }

  const tickerIndexes = lines
    .map((line, index) => (/^[A-Z]{1,5}(?=\s|$|\[|[^A-Za-z])/.test(line) ? index : -1))
    .filter((index) => index >= 0);

  return tickerIndexes
    .map((startIndex, position) => {
      const endIndex = tickerIndexes[position + 1] ?? lines.length;
      return parseUsEtfPortfolioBlock(lines.slice(startIndex, endIndex));
    })
    .filter(Boolean);
}

function parseUsEtfPortfolioBlock(block) {
  const firstLine = block[0] ?? "";
  const tickerMatch = firstLine.match(/^([A-Z]{1,5})(?=\s|$|\[|[^A-Za-z])/);
  if (!tickerMatch) return null;

  const code = tickerMatch[1];
  const bracketName = firstLine.match(/\[([^\]]+)\]/)?.[1];
  const name = bracketName || firstLine.replace(code, "").replace(/^\s+/, "") || `${code} 米国ETF`;
  const numericValues = block
    .map((line) => toNumber(line))
    .filter((value) => Number.isFinite(value));
  if (numericValues.length < 4) return null;

  const [qty, buy, current, marketValue] = numericValues;
  const costAmount = Number.isFinite(qty) && Number.isFinite(buy) && Number.isFinite(current) && Number.isFinite(marketValue)
    ? Math.round(qty * buy * (marketValue / (qty * current)))
    : null;

  return {
    assetClass: "米国ETF",
    code,
    name,
    sector: "米国ETF",
    currency: "USD",
    qty,
    buy,
    current,
    marketValue,
    costAmount,
    gainLossAmount: Number.isFinite(marketValue) && Number.isFinite(costAmount) ? marketValue - costAmount : null,
    dividendStatus: "未入力",
    dividend: null,
  };
}

function parseBrokerCsvRows(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = [];
  let currentFundSection = null;
  let fundIndex = 0;

  lines.forEach((line) => {
    if (line.startsWith("投資信託") && line.includes("成長投資枠")) {
      currentFundSection = "成長投資枠";
      fundIndex = 0;
      return;
    }
    if (line.startsWith("投資信託") && line.includes("つみたて投資枠")) {
      currentFundSection = "つみたて投資枠";
      fundIndex = 0;
      return;
    }
    if (line.startsWith("株式")) {
      currentFundSection = null;
      return;
    }
    if (!currentFundSection || line.startsWith("ファンド名") || line.startsWith("評価額合計")) return;
    if (!line.startsWith('"')) return;

    const cells = parseCsvLine(line);
    if (cells.length < 9 || !String(cells[1]).includes("口")) return;

    fundIndex += 1;
    const sectionCode = currentFundSection === "成長投資枠" ? "G" : "T";
    rows.push({
      assetClass: "投資信託",
      code: `FUND-${sectionCode}${String(fundIndex).padStart(2, "0")}`,
      name: cells[0],
      sector: `${classifyFundCategory(cells[0])} / ${currentFundSection}`,
      qty: toNumber(String(cells[1]).replace("口", "")),
      buy: toNumber(cells[3]),
      current: toNumber(cells[4]),
      costAmount: toNumber(cells[5]),
      marketValue: toNumber(cells[6]),
      gainLossAmount: toNumber(cells[7]),
      dividendStatus: cells[8] === "再投資" ? "無分配" : "参考",
      dividend: null,
    });
  });

  return rows;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuote = !inQuote;
    } else if (char === "," && !inQuote) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function classifyFundCategory(name) {
  if (name.includes("国内債券")) return "国内債券";
  if (name.includes("先進国債券")) return "先進国債券";
  if (name.includes("Ｓ＆Ｐ５００") || name.includes("S&P500")) return "米国株式";
  if (name.includes("外国株式")) return "外国株式";
  if (name.includes("全世界株式")) return "全世界株式";
  return "投資信託";
}

function parseYahooTableRows(text) {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.includes("コード") && line.includes("現在値") && line.includes("前日比"));
  if (headerIndex < 0) return [];

  const rawHeaders = splitTabLine(lines[headerIndex]);
  const ignoredColumnIndexes = getIgnoredYahooColumnIndexes(rawHeaders);
  const headers = rawHeaders.filter((_, index) => !ignoredColumnIndexes.has(index));
  const indexes = {
    code: findYahooHeaderIndex(headers, "code"),
    market: findYahooHeaderIndex(headers, "market"),
    name: findYahooHeaderIndex(headers, "name"),
    current: findYahooHeaderIndex(headers, "current"),
    buy: findYahooHeaderIndex(headers, "buy"),
    qty: findYahooHeaderIndex(headers, "qty"),
    dayChange: findYahooHeaderIndex(headers, "dayChange"),
    dayChangePct: findYahooHeaderIndex(headers, "dayChangePct"),
    sector: findYahooHeaderIndex(headers, "sector"),
    dividend: findYahooHeaderIndex(headers, "dividend"),
    dividendYield: findYahooHeaderIndex(headers, "dividendYield"),
    memo: findYahooHeaderIndex(headers, "memo"),
  };

  if (indexes.code < 0) return [];
  console.log("[dividend-manager] Yahoo table headers", { headers, indexes });

  return lines
    .slice(headerIndex + 1)
    .map((line) => {
      const cells = normalizeYahooRowCells(splitTabLine(line), rawHeaders, ignoredColumnIndexes);
      const parsed = parseYahooTableRow(cells, indexes);
      logYahoo8593TableDebug({ rawLine: line, rawHeaders, headers, cells, indexes, parsed });
      return parsed;
    })
    .filter(Boolean);
}

function splitTabLine(line) {
  return line.split("\t").map((cell) => cell.trim());
}

function getIgnoredYahooColumnIndexes(headers) {
  return new Set(
    headers
      .map((header, index) => (/チャート|画像/.test(normalizeHeaderText(header)) ? index : -1))
      .filter((index) => index >= 0),
  );
}

function normalizeYahooRowCells(cells, rawHeaders, ignoredColumnIndexes) {
  if (ignoredColumnIndexes.size === 0) return cells;
  if (cells.length >= rawHeaders.length) {
    return cells.filter((_, index) => !ignoredColumnIndexes.has(index));
  }
  return cells;
}

function findHeaderIndex(headers, label) {
  if (label === "前日比%") {
    return headers.findIndex((header) => header.includes("前日比") && (header.includes("%") || header.includes("％")));
  }
  return headers.findIndex((header) => header === label || header.includes(label));
}

function findYahooHeaderIndex(headers, field) {
  const normalizedHeaders = headers.map((header) => normalizeHeaderText(header));
  const find = (predicate) => normalizedHeaders.findIndex(predicate);

  const indexByField = {
    code: () => find((header) => header === "コード" || header.includes("コード")),
    market: () => find((header) => header === "市場" || header.includes("市場")),
    name: () => find((header) => header === "名称" || header.includes("銘柄名") || header.includes("名称")),
    current: () => find((header) => header.includes("現在値")),
    buy: () => find((header) => header.includes("購入価格") || header.includes("取得単価")),
    qty: () => find((header) => header.includes("保有数") || header.includes("保有数量")),
    dayChange: () => find((header) => header.includes("前日比") && !header.includes("%") && !header.includes("％") && !header.includes("率")),
    dayChangePct: () => find((header) => header.includes("前日比") && (header.includes("%") || header.includes("％") || header.includes("率"))),
    sector: () => find((header) => header.includes("業種")),
    dividend: () =>
      find(
        (header) =>
          (header.includes("1株配当") || header.includes("一株配当")) &&
          !header.includes("利回り") &&
          !header.includes("年度"),
      ),
    dividendYield: () => find((header) => header.includes("配当利回り") || header === "利回り"),
    memo: () => find((header) => header.includes("メモ") || header.includes("MEMO")),
  };

  return indexByField[field]?.() ?? -1;
}

function normalizeHeaderText(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[()（）]/g, "")
    .trim();
}

function parseYahooTableRow(cells, indexes) {
  const code = cells[indexes.code];
  if (!/^\d{4}$/.test(code ?? "")) return null;

  return {
    code,
    market: indexes.market >= 0 ? normalizeEmptyValue(cells[indexes.market]) : null,
    name: normalizeEmptyValue(cells[indexes.name]),
    current: parseYahooNumericCell(cells[indexes.current]),
    buy: parseYahooNumericCell(cells[indexes.buy]),
    qty: parseYahooNumericCell(cells[indexes.qty]),
    dayChange: parseYahooSignedNumericCell(cells[indexes.dayChange]),
    dayChangePct: indexes.dayChangePct >= 0 ? parseYahooPercentCell(cells[indexes.dayChangePct]) : null,
    sector: normalizeEmptyValue(cells[indexes.sector]),
    dividend: parseYahooDividendCell(cells[indexes.dividend]),
    dividendYield: indexes.dividendYield >= 0 ? parseYahooPercentCell(cells[indexes.dividendYield]) : null,
    memo: indexes.memo >= 0 ? normalizeEmptyValue(cells[indexes.memo]) : null,
  };
}

function logYahoo8593TableDebug({ rawLine, rawHeaders, headers, cells, indexes, parsed }) {
  if (String(parsed?.code) !== "8593") return;
  const headerValueMap = headers.reduce((map, header, index) => {
    map[header || `(列${index + 1})`] = cells[index] ?? "";
    return map;
  }, {});
  console.log("[dividend-manager] 8593 raw row text", rawLine);
  console.log("[dividend-manager] 8593 split cells", cells);
  console.log("[dividend-manager] 8593 raw headers", rawHeaders);
  console.log("[dividend-manager] 8593 headers", headers);
  console.log("[dividend-manager] 8593 header/value map", headerValueMap);
  console.log("[dividend-manager] 8593 final parsed object", parsed);
  console.log("[dividend-manager] 8593 parsed indexes", indexes);
}

function parseYahooNumericCell(value) {
  const normalized = normalizeEmptyValue(value);
  if (!normalized || isYahooNonPriceNumber(normalized)) return null;
  return toNumber(normalized);
}

function parseYahooSignedNumericCell(value) {
  const normalized = normalizeEmptyValue(value);
  if (!normalized || isYahooNonPriceNumber(normalized)) return null;
  return toNumber(normalized);
}

function parseYahooPercentCell(value) {
  const normalized = normalizeEmptyValue(value);
  if (!normalized || isYahooNonPriceNumber(normalized) || !String(normalized).includes("%")) return null;
  return toNumber(normalized);
}

function parseYahooDividendCell(value) {
  const normalized = normalizeEmptyValue(value);
  if (!normalized || isYahooNonPriceNumber(normalized) || String(normalized).includes("%")) return null;
  return toNumber(normalized);
}

function isYahooNonPriceNumber(value) {
  const text = String(value || "").trim();
  return /^\d{1,2}:\d{2}$/.test(text) || /^\d{4}\/\d{2}$/.test(text) || /チャート|画像/.test(text);
}

function parseYahooPortfolioBlocks(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const codeIndexes = lines
    .map((line, index) => (/^\d{4}$/.test(line) ? index : -1))
    .filter((index) => index >= 0);

  return codeIndexes
    .map((startIndex, position) => {
      const endIndex = codeIndexes[position + 1] ?? lines.length;
      return parseYahooPortfolioBlock(lines.slice(startIndex, endIndex));
    })
    .filter(Boolean);
}

function parseYahooPortfolioBlock(block) {
  if (extractImportMemo(block.join(" "))?.includes("検討中")) {
    return parseYahooWatchlistPortfolioBlock(block);
  }
  return parseYahooHoldingPortfolioBlock(block);
}

function parseYahooHoldingPortfolioBlock(block) {
  const code = block[0];
  const market = isYahooMarketName(block[1]) ? block[1] : null;
  const name = block[2] ?? "";
  const current = toNumber(block[3]);
  const buy = toNumber(block[5]);
  const qty = toNumber(block[6]);
  const chartIndex = block.findIndex((line) => line.includes("チャート"));
  const dayChange = chartIndex >= 0 ? toNumber(block[chartIndex + 1]) : null;
  const dayChangePct = chartIndex >= 0 ? toNumber(block[chartIndex + 2]) : null;
  const sector = chartIndex >= 0 ? normalizeEmptyValue(block[chartIndex + 3]) : null;
  const dividend = chartIndex >= 0 ? toNumber(normalizeEmptyValue(block[chartIndex + 4])) : null;
  const memo = extractImportMemo(block.join(" "));

  return {
    code,
    name,
    market,
    current,
    buy,
    qty,
    dayChange,
    dayChangePct,
    sector,
    dividend,
    memo,
  };
}

function parseYahooWatchlistPortfolioBlock(block) {
  const code = block[0];
  const name = extractYahooBlockName(block);
  const market = extractYahooBlockMarket(block);
  const current = findYahooBlockNumericValue(block, ["現在値", "株価"]) ?? findFirstYahooBlockCurrent(block);
  const buy = findYahooBlockNumericValue(block, ["購入価格", "取得単価"]);
  const qty = findYahooBlockNumericValue(block, ["保有数", "保有数量"]);
  const dayChange = findYahooBlockSignedValue(block, ["前日比"]) ?? findFirstYahooBlockSignedNumber(block);
  const dayChangePct = findYahooBlockPercentValue(block, ["前日比%"]) ?? findFirstYahooBlockSignedPercent(block);
  const sector = findYahooBlockTextValue(block, ["業種"]);
  const dividend = findYahooBlockDividendValue(block, ["1株配当", "一株配当"]);
  const dividendYield = findYahooBlockPercentValue(block, ["配当利回り", "利回り"]) ?? findFirstYahooBlockUnsignedPercent(block);
  const memo = extractImportMemo(block.join(" "));
  const parsed = {
    code,
    name,
    market,
    current,
    buy,
    qty,
    dayChange,
    dayChangePct,
    sector,
    dividend,
    dividendYield,
    memo,
  };
  logYahoo8593BlockDebug(block, parsed);
  return parsed;
}

function extractYahooBlockName(block) {
  if (isYahooMarketName(block[1]) && normalizeEmptyValue(block[2])) {
    return block[2];
  }

  const nameLine = block.find(
    (line, index) =>
      index > 0 &&
      !isYahooMarketName(line) &&
      !isYahooNonPriceNumber(line) &&
      !/^\d{4}$/.test(line) &&
      !/[+-]?\d[\d,]*(?:\.\d+)?%?/.test(line) &&
      !/チャート|画像|現在値|前日比|購入価格|取得単価|保有数|保有数量|1株配当|一株配当|配当利回り|利回り|メモ|NISA|検討中/.test(line),
  );
  return normalizeEmptyValue(nameLine) || block[1] || "";
}

function extractYahooBlockMarket(block) {
  return block.find((line, index) => index > 0 && isYahooMarketName(line)) || null;
}

function isYahooMarketName(value) {
  return /^(東証|名証|札証|福証)(PRM|STD|GRT|PRO)?$|^(東証プライム|東証スタンダード|東証グロース)$/.test(
    String(value || "").trim(),
  );
}

function findYahooBlockNumericValue(block, labels) {
  return findYahooBlockValue(block, labels, parseYahooNumericCell);
}

function findYahooBlockSignedValue(block, labels) {
  return findYahooBlockValue(block, labels, parseYahooSignedNumericCell);
}

function findYahooBlockPercentValue(block, labels) {
  return findYahooBlockValue(block, labels, parseYahooPercentCell);
}

function findYahooBlockDividendValue(block, labels) {
  return findYahooBlockValue(block, labels, parseYahooDividendCell);
}

function findYahooBlockTextValue(block, labels) {
  return findYahooBlockValue(block, labels, (value) => normalizeEmptyValue(value));
}

function findYahooBlockValue(block, labels, parser) {
  for (let index = 0; index < block.length; index += 1) {
    const line = block[index];
    const label = labels.find((item) => line.includes(item));
    if (!label) continue;

    const inlineValue = normalizeEmptyValue(line.replace(label, "").replace(/[：:]/g, "").trim());
    const parsedInline = parser(inlineValue);
    if (parsedInline !== null && parsedInline !== undefined) return parsedInline;

    for (let offset = 1; offset <= 3; offset += 1) {
      const next = block[index + offset];
      if (!next || isYahooBlockLabel(next)) break;
      const parsedNext = parser(next);
      if (parsedNext !== null && parsedNext !== undefined) return parsedNext;
    }
  }
  return null;
}

function isYahooBlockLabel(value) {
  return /現在値|株価|前日比|購入価格|取得単価|保有数|保有数量|1株配当|一株配当|配当利回り|利回り|業種|メモ/.test(String(value || ""));
}

function findFirstYahooBlockCurrent(block) {
  const values = block
    .map((line) => ({ line, value: parseYahooNumericCell(line) }))
    .filter((item) => Number.isFinite(item.value) && item.value !== toNumber(block[0]));
  return values.find((item) => item.value > 10 && !String(item.line).includes("%"))?.value ?? null;
}

function findFirstYahooBlockSignedNumber(block) {
  const item = block.find((line) => /^[+-]\s*\d[\d,]*(?:\.\d+)?$/.test(String(line).trim()) && !isYahooNonPriceNumber(line));
  return parseYahooSignedNumericCell(item);
}

function findFirstYahooBlockSignedPercent(block) {
  const item = block.find((line) => /^[+-]\s*\d[\d,]*(?:\.\d+)?%$/.test(String(line).trim()));
  return parseYahooPercentCell(item);
}

function findFirstYahooBlockUnsignedPercent(block) {
  const item = block.find((line) => /^\d[\d,]*(?:\.\d+)?%$/.test(String(line).trim()));
  return parseYahooPercentCell(item);
}

function logYahoo8593BlockDebug(block, parsed) {
  if (String(parsed?.code) !== "8593") return;
  const inferredMap = {
    code: parsed.code,
    name: parsed.name,
    market: parsed.market,
    current: parsed.current,
    buy: parsed.buy,
    qty: parsed.qty,
    dayChange: parsed.dayChange,
    dayChangePct: parsed.dayChangePct,
    sector: parsed.sector,
    dividend: parsed.dividend,
    dividendYield: parsed.dividendYield,
    memo: parsed.memo,
  };
  console.log("[dividend-manager] 8593 raw row text", block.join("\n"));
  console.log("[dividend-manager] 8593 split cells", block);
  console.log("[dividend-manager] 8593 raw headers", []);
  console.log("[dividend-manager] 8593 headers", ["Yahoo block inferred"]);
  console.log("[dividend-manager] 8593 header/value map", inferredMap);
  console.log("[dividend-manager] 8593 final parsed object", parsed);
}

function normalizeEmptyValue(value) {
  if (!value || value === "---" || value === "---%") return null;
  return value;
}

function parseImportLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const codeMatch = trimmed.match(/(?:^|[^\d])(\d{4})(?:\.T)?(?:[^\d]|$)/);
  if (!codeMatch) return null;

  const code = codeMatch[1];
  const afterCode = trimmed.slice(codeMatch.index + codeMatch[0].indexOf(code) + code.length);
  const cells = trimmed.split(/\t+/).map((cell) => cell.trim()).filter(Boolean);
  const codeCellIndex = cells.findIndex((cell) => new RegExp(`^${code}(?:\\.T)?$|^${code}\\b`).test(cell));
  const scanCells = codeCellIndex >= 0 ? cells.slice(codeCellIndex + 1) : [afterCode];
  const scanText = scanCells.join(" ");
  const tokens = scanText.match(/[+-]?\d[\d,]*(?:\.\d+)?%?/g) ?? [];
  const percentToken = tokens.find((token) => token.includes("%"));
  const signedTokens = tokens.filter((token) => /^[+-]/.test(token) && !token.includes("%"));
  const numericTokens = tokens.filter((token) => !token.includes("%"));
  const currentToken = numericTokens.find((token) => !/^[+-]/.test(token) && toNumber(token) !== Number(code));
  const dayChangeToken = signedTokens[0];
  const name = extractImportName(cells, codeCellIndex, afterCode);
  const market = codeCellIndex >= 0 && isYahooMarketName(cells[codeCellIndex + 1]) ? cells[codeCellIndex + 1] : null;
  const buy = findYahooBlockNumericValue(cells, ["購入価格", "取得単価"]);
  const qty = findYahooBlockNumericValue(cells, ["保有数", "保有数量"]);
  const dividend = findYahooBlockDividendValue(cells, ["1株配当", "一株配当"]);
  const dividendYield = findYahooBlockPercentValue(cells, ["配当利回り", "利回り"]) ?? findFirstYahooBlockUnsignedPercent(cells);

  const parsed = {
    code,
    name,
    market,
    current: toNumber(currentToken),
    buy,
    qty,
    dayChange: toNumber(dayChangeToken),
    dayChangePct: toNumber(percentToken),
    dividend,
    dividendYield,
    memo: extractImportMemo(trimmed),
  };
  logYahoo8593LineDebug({ rawLine: line, cells, parsed });
  return parsed;
}

function logYahoo8593LineDebug({ rawLine, cells, parsed }) {
  if (String(parsed?.code) !== "8593") return;
  console.log("[dividend-manager] 8593 raw row text", rawLine);
  console.log("[dividend-manager] 8593 split cells", cells);
  console.log("[dividend-manager] 8593 raw headers", []);
  console.log("[dividend-manager] 8593 headers", ["line fallback inferred"]);
  console.log("[dividend-manager] 8593 header/value map", {
    code: parsed.code,
    name: parsed.name,
    market: parsed.market,
    current: parsed.current,
    dayChange: parsed.dayChange,
    dayChangePct: parsed.dayChangePct,
    dividend: parsed.dividend,
    dividendYield: parsed.dividendYield,
    memo: parsed.memo,
  });
  console.log("[dividend-manager] 8593 final parsed object", parsed);
}

function extractImportMemo(text) {
  const value = String(text || "");
  const labels = [];
  if (value.includes("検討中")) labels.push("検討中");
  if (value.toUpperCase().includes("NISA")) labels.push("NISA");
  return labels.length > 0 ? labels.join(" ") : null;
}

function extractImportName(cells, codeCellIndex, afterCode) {
  if (codeCellIndex >= 0 && cells[codeCellIndex + 1]) {
    if (isYahooMarketName(cells[codeCellIndex + 1]) && cells[codeCellIndex + 2]) {
      return cells[codeCellIndex + 2];
    }
    return cells[codeCellIndex + 1];
  }
  return afterCode
    .replace(/[+-]?\d[\d,]*(?:\.\d+)?%?.*$/, "")
    .replace(/^[\s\-.、]+/, "")
    .trim();
}

function previewImport() {
  importRows = parseImportText(document.querySelector("#importText").value);
  logParsedImportRows(importRows);
  renderImportPreview(importRows);
}

function logParsedImportRows(rows) {
  console.log("[dividend-manager] parsed import rows", rows);
  const target = rows.find((row) => String(row.code) === "8593");
  if (target) {
    console.log("[dividend-manager] parsed 8593", target);
  }
}

function renderImportPreview(rows) {
  const table = document.querySelector("#importPreviewTable");
  const status = document.querySelector("#importStatus");
  table.innerHTML = "";

  if (rows.length === 0) {
    status.textContent = "取り込める銘柄コードが見つかりませんでした。";
    return;
  }

  const applicableRows = rows.filter((row) => findStockByCode(row.code) || findWatchlistByCode(row.code) || canAddImportedRow(row));
  status.textContent = `${rows.length}件を読み取り、${applicableRows.length}件が更新または追加できます。`;

  rows.forEach((row) => {
    const target = findStockByCode(row.code);
    const watchTarget = findWatchlistByCode(row.code);
    const canAdd = !target && canAddImportedRow(row);
    const statusLabel = isWatchlistImportRow(row)
      ? watchTarget
        ? "検討中更新"
        : "検討中追加"
      : target
        ? "更新対象"
        : canAdd
          ? "追加対象"
          : "未登録";
    logYahoo8593PreviewDebug(row);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.code}</td>
      <td>${row.name || "-"}</td>
      <td class="${numberToneClass(row.current)}">${formatNumber(row.current)}</td>
      <td class="${numberToneClass(row.buy)}">${formatNumber(row.buy)}</td>
      <td class="${numberToneClass(row.qty)}">${formatNumber(row.qty)}</td>
      <td class="${numberToneClass(row.marketValue)}">${formatYenPrecise(row.marketValue)}</td>
      <td class="${numberToneClass(row.gainLossAmount)}">${formatSignedYen(row.gainLossAmount)}</td>
      <td class="${dayChangeToneClass(row.dayChange)}">${formatSignedNumber(row.dayChange)}</td>
      <td class="${dayChangeToneClass(row.dayChangePct)}">${formatSignedPercent(row.dayChangePct)}</td>
      <td>${row.sector || "-"}</td>
      <td>${formatNumber(row.dividend)}</td>
      <td>${formatPercent(row.dividendYield)}</td>
      <td>${displayDividendStatus(row.dividendStatus) || "-"}</td>
      <td><span class="import-badge ${target || watchTarget || canAdd ? "is-match" : ""}">${statusLabel}</span></td>
    `;
    table.append(tr);
  });
}

function logYahoo8593PreviewDebug(row) {
  if (String(row?.code) !== "8593") return;
  console.log("[dividend-manager] 8593 preview row object", row);
  console.log("[dividend-manager] 8593 preview current", row.current);
  console.log("[dividend-manager] 8593 preview dayChange", row.dayChange);
  console.log("[dividend-manager] 8593 preview dayChangePct", row.dayChangePct);
  console.log("[dividend-manager] 8593 preview dividend", row.dividend);
  console.log("[dividend-manager] 8593 preview dividendYield", row.dividendYield);
}

function canAddImportedRow(row) {
  return Boolean(row?.code) && (Boolean(row.name) || ["投資信託", "米国ETF"].includes(row.assetClass) || /^\d{4}$/.test(String(row.code)));
}

function isWatchlistImportRow(row) {
  return String(row?.memo || "").includes("検討中");
}

function normalizeImportedRow(row) {
  const assetClass = row.assetClass || (/^\d{4}$/.test(String(row.code)) ? "日本株" : "米国ETF");
  return {
    assetClass,
    code: row.code,
    name: row.name || String(row.code),
    market: row.market || null,
    sector: row.sector || (assetClass === "米国ETF" ? "米国ETF" : ""),
    current: Number.isFinite(row.current) ? row.current : null,
    dayChange: Number.isFinite(row.dayChange) ? row.dayChange : null,
    dayChangePct: Number.isFinite(row.dayChangePct) ? row.dayChangePct : null,
    buy: Number.isFinite(row.buy) ? row.buy : null,
    qty: Number.isFinite(row.qty) ? row.qty : null,
    costAmount: Number.isFinite(row.costAmount) ? row.costAmount : null,
    marketValue: Number.isFinite(row.marketValue) ? row.marketValue : null,
    gainLossAmount: Number.isFinite(row.gainLossAmount) ? row.gainLossAmount : null,
    dividendStatus: normalizeDividendStatusValue(row.dividendStatus || (Number.isFinite(row.dividend) ? "配当あり" : "未入力")),
    dividend: Number.isFinite(row.dividend) ? row.dividend : null,
    dividendYield: Number.isFinite(row.dividendYield) ? row.dividendYield : null,
    currentYield: Number.isFinite(row.dividendYield) ? row.dividendYield : null,
    memo: row.memo || null,
  };
}

function normalizeWatchlistImportedRow(row) {
  return {
    assetClass: "日本株",
    code: row.code,
    name: row.name || String(row.code),
    market: row.market || null,
    sector: row.sector || "",
    current: Number.isFinite(row.current) ? row.current : null,
    dayChange: Number.isFinite(row.dayChange) ? row.dayChange : null,
    dayChangePct: Number.isFinite(row.dayChangePct) ? row.dayChangePct : null,
    buy: Number.isFinite(row.buy) ? row.buy : null,
    purchasePrice: Number.isFinite(row.purchasePrice) ? row.purchasePrice : Number.isFinite(row.buy) ? row.buy : null,
    qty: Number.isFinite(row.qty) ? row.qty : null,
    marketValue: Number.isFinite(row.marketValue) ? row.marketValue : null,
    costAmount: Number.isFinite(row.costAmount) ? row.costAmount : null,
    gainLossAmount: Number.isFinite(row.gainLossAmount) ? row.gainLossAmount : null,
    gainLossPct: Number.isFinite(row.gainLossPct) ? row.gainLossPct : null,
    dividend: Number.isFinite(row.dividend) ? row.dividend : null,
    dividendYield: Number.isFinite(row.dividendYield) ? row.dividendYield : null,
    currentYield: Number.isFinite(row.dividendYield) ? row.dividendYield : null,
    dividendStatus: Number.isFinite(row.dividend) ? "集計対象" : "未入力",
    memo: row.memo || "検討中",
  };
}

function upsertWatchlistRow(row) {
  const next = normalizeWatchlistImportedRow(row);
  console.log("[dividend-manager] watchlist row before save", next);
  const index = watchlist.findIndex((stock) => String(stock.code) === String(next.code));
  if (index >= 0) {
    watchlist[index] = next;
  } else {
    watchlist.push(next);
  }
}

function removeFromHoldingsByCode(code) {
  stocks = stocks.filter((stock) => String(stock.code) !== String(code));
  excludedStocks = excludedStocks.filter((stock) => String(stock.code) !== String(code));
}

function removeFromWatchlistByCode(code) {
  watchlist = watchlist.filter((stock) => String(stock.code) !== String(code));
}

function applyImport() {
  if (importRows.length === 0) {
    previewImport();
  }

  const hasApplicableRows = importRows.some((row) => findStockByCode(row.code) || findWatchlistByCode(row.code) || canAddImportedRow(row));
  if (hasApplicableRows) rememberState();

  let updated = 0;
  importRows.forEach((row) => {
    if (isWatchlistImportRow(row)) {
      if (!canAddImportedRow(row)) return;
      upsertWatchlistRow(row);
      removeFromHoldingsByCode(row.code);
      updated += 1;
      return;
    }

    removeFromWatchlistByCode(row.code);
    const target = findStockByCode(row.code);
    if (!target && canAddImportedRow(row)) {
      stocks.push(normalizeImportedRow(row));
      updated += 1;
      return;
    }
    if (!target) return;
    if (row.assetClass) target.stock.assetClass = row.assetClass;
    if (row.name) target.stock.name = row.name;
    if (Number.isFinite(row.current)) target.stock.current = row.current;
    if (Number.isFinite(row.dayChange)) target.stock.dayChange = row.dayChange;
    if (Number.isFinite(row.dayChangePct)) target.stock.dayChangePct = row.dayChangePct;
    if (Number.isFinite(row.buy)) target.stock.buy = row.buy;
    if (Number.isFinite(row.qty)) target.stock.qty = row.qty;
    if (Number.isFinite(row.costAmount)) target.stock.costAmount = row.costAmount;
    if (Number.isFinite(row.marketValue)) target.stock.marketValue = row.marketValue;
    if (Number.isFinite(row.gainLossAmount)) target.stock.gainLossAmount = row.gainLossAmount;
    if (Number.isFinite(row.dividend)) target.stock.dividend = row.dividend;
    if (Number.isFinite(row.dividendYield)) {
      target.stock.dividendYield = row.dividendYield;
      target.stock.currentYield = row.dividendYield;
    }
    if (row.sector) target.stock.sector = row.sector;
    if (row.dividendStatus) target.stock.dividendStatus = normalizeDividendStatusValue(row.dividendStatus);
    updated += 1;
  });

  if (updated > 0) {
    saveStocks();
    saveExcludedStocks();
    saveWatchlist();
    console.log("[dividend-manager] saved watchlist", watchlist);
    render();
    autoFitTablesToContent();
    renderImportPreview(importRows);
  }
  document.querySelector("#importStatus").textContent = `${updated}件を更新しました。保有銘柄またはウォッチリストに反映済みです。`;
}

function findStockByCode(code) {
  const normalIndex = stocks.findIndex((stock) => String(stock.code) === String(code));
  if (normalIndex >= 0) return { stock: stocks[normalIndex], excluded: false };

  const excludedIndex = excludedStocks.findIndex((stock) => String(stock.code) === String(code));
  if (excludedIndex >= 0) return { stock: excludedStocks[excludedIndex], excluded: true };

  return null;
}

function findWatchlistByCode(code) {
  const index = watchlist.findIndex((stock) => String(stock.code) === String(code));
  return index >= 0 ? { stock: watchlist[index], index } : null;
}

function clearImport() {
  importRows = [];
  document.querySelector("#csvFileInput").value = "";
  document.querySelector("#importText").value = "";
  document.querySelector("#importPreviewTable").innerHTML = "";
  document.querySelector("#importStatus").textContent = "まだデータは読み込まれていません。";
}

function clearWatchlist() {
  if (watchlist.length > 0) rememberState();
  watchlist = [];
  saveWatchlist();
  console.log("[dividend-manager] saved watchlist", watchlist);
  renderWatchlist();
  renderSortHeaders();
  setupColumnResizers();
  updateTopScrollbars();
}

function handleCsvFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    document.querySelector("#importText").value = String(reader.result ?? "");
    previewImport();
  });
  reader.addEventListener("error", () => {
    document.querySelector("#importStatus").textContent = "CSVファイルを読み込めませんでした。";
  });
  reader.readAsText(file, "Shift_JIS");
}

function changeSort(field) {
  sortState =
    sortState.field === field
      ? { field, direction: sortState.direction === "asc" ? "desc" : "asc" }
      : { field, direction: defaultSortDirection(field) };
  render();
}

function changeExcludedSort(field) {
  excludedSortState =
    excludedSortState.field === field
      ? { field, direction: excludedSortState.direction === "asc" ? "desc" : "asc" }
      : { field, direction: defaultSortDirection(field) };
  render();
}

function changeDailySort(tableType, field) {
  const currentState = tableType === "candidates" ? buyCandidateSortState : dailyDeclinersSortState;
  const nextState =
    currentState.field === field
      ? { field, direction: currentState.direction === "asc" ? "desc" : "asc" }
      : { field, direction: defaultSortDirection(field) };

  if (tableType === "candidates") {
    buyCandidateSortState = nextState;
  } else {
    dailyDeclinersSortState = nextState;
  }
  render();
}

function changeWatchlistSort(field) {
  watchlistSortState =
    watchlistSortState.field === field
      ? { field, direction: watchlistSortState.direction === "asc" ? "desc" : "asc" }
      : { field, direction: defaultSortDirection(field) };
  render();
}

function defaultSortDirection(field) {
  return ["assetClass", "code", "name", "sector", "dividendStatus", "buyCandidateReasonsText", "memo"].includes(field) ? "asc" : "desc";
}

function renderSortHeaders() {
  document.querySelectorAll("th[data-sort]").forEach((header) => {
    const isActive = header.dataset.sort === sortState.field;
    header.classList.toggle("is-sorted", isActive);
    header.dataset.direction = isActive ? sortState.direction : "";
    header.setAttribute(
      "aria-sort",
      isActive ? (sortState.direction === "asc" ? "ascending" : "descending") : "none",
    );
  });
  document.querySelectorAll("th[data-excluded-sort]").forEach((header) => {
    const isActive = header.dataset.excludedSort === excludedSortState.field;
    header.classList.toggle("is-sorted", isActive);
    header.dataset.direction = isActive ? excludedSortState.direction : "";
    header.setAttribute(
      "aria-sort",
      isActive ? (excludedSortState.direction === "asc" ? "ascending" : "descending") : "none",
    );
  });
  document.querySelectorAll("th[data-daily-sort]").forEach((header) => {
    const state = header.dataset.dailyTable === "candidates" ? buyCandidateSortState : dailyDeclinersSortState;
    const isActive = header.dataset.dailySort === state.field;
    header.classList.toggle("is-sorted", isActive);
    header.dataset.direction = isActive ? state.direction : "";
    header.setAttribute(
      "aria-sort",
      isActive ? (state.direction === "asc" ? "ascending" : "descending") : "none",
    );
  });
  document.querySelectorAll("th[data-watchlist-sort]").forEach((header) => {
    const isActive = header.dataset.watchlistSort === watchlistSortState.field;
    header.classList.toggle("is-sorted", isActive);
    header.dataset.direction = isActive ? watchlistSortState.direction : "";
    header.setAttribute(
      "aria-sort",
      isActive ? (watchlistSortState.direction === "asc" ? "ascending" : "descending") : "none",
    );
  });
  renderSortedColumnHighlight();
}

function renderSortedColumnHighlight() {
  document.querySelectorAll("#stockTable td").forEach((cell) => {
    cell.classList.remove("is-sorted-column");
  });
  document.querySelectorAll("#excludedStockTable td").forEach((cell) => {
    cell.classList.remove("is-sorted-column");
  });
  document.querySelectorAll("#dailyDeclinersTable td, #buyCandidateTable td").forEach((cell) => {
    cell.classList.remove("is-sorted-column");
  });
  document.querySelectorAll("#watchlistTable td").forEach((cell) => {
    cell.classList.remove("is-sorted-column");
  });

  const activeHeader = document.querySelector(`th[data-sort="${sortState.field}"]`);
  if (!activeHeader) return;

  const columnIndex = [...activeHeader.parentElement.children].indexOf(activeHeader) + 1;
  document.querySelectorAll(`#stockTable tr td:nth-child(${columnIndex})`).forEach((cell) => {
    cell.classList.add("is-sorted-column");
  });

  const activeExcludedHeader = document.querySelector(`th[data-excluded-sort="${excludedSortState.field}"]`);
  if (!activeExcludedHeader) return;

  const excludedColumnIndex = [...activeExcludedHeader.parentElement.children].indexOf(activeExcludedHeader) + 1;
  document.querySelectorAll(`#excludedStockTable tr td:nth-child(${excludedColumnIndex})`).forEach((cell) => {
    cell.classList.add("is-sorted-column");
  });

  [
    { tableId: "dailyDeclinersTable", state: dailyDeclinersSortState, tableType: "decliners" },
    { tableId: "buyCandidateTable", state: buyCandidateSortState, tableType: "candidates" },
  ].forEach(({ tableId, state, tableType }) => {
    const header = document.querySelector(`th[data-daily-table="${tableType}"][data-daily-sort="${state.field}"]`);
    if (!header) return;
    const columnIndex = [...header.parentElement.children].indexOf(header) + 1;
    document.querySelectorAll(`#${tableId} tr td:nth-child(${columnIndex})`).forEach((cell) => {
      cell.classList.add("is-sorted-column");
    });
  });

  const watchlistHeader = document.querySelector(`th[data-watchlist-sort="${watchlistSortState.field}"]`);
  if (watchlistHeader) {
    const columnIndex = [...watchlistHeader.parentElement.children].indexOf(watchlistHeader) + 1;
    document.querySelectorAll(`#watchlistTable tr td:nth-child(${columnIndex})`).forEach((cell) => {
      cell.classList.add("is-sorted-column");
    });
  }
}

document.querySelector("#searchInput").addEventListener("input", render);
document.querySelector("#assetClassFilter").addEventListener("change", render);
document.querySelector("#dividendStatusFilter").addEventListener("change", render);
document.querySelector("#dailyDeclinersDividendOnly")?.addEventListener("change", render);
document.querySelector("#snapshotRangeFilter")?.addEventListener("click", (event) => {
  const button = event.target.closest(".trend-range-button");
  if (!button) return;
  currentSnapshotRange = button.dataset.range || "1m";
  renderPortfolioSnapshotChart();
});
document.querySelector("#undoButton").addEventListener("click", undoDataChange);
document.querySelector("#redoButton").addEventListener("click", redoDataChange);
document.querySelector("#saveSnapshotButton")?.addEventListener("click", saveTodayPortfolioSnapshot);
document.querySelector("#saveTestSnapshotButton")?.addEventListener("click", saveYesterdayTestPortfolioSnapshot);
document.querySelector("#exportButton").addEventListener("click", exportCsv);
document.querySelector("#csvFileInput").addEventListener("change", handleCsvFileChange);
document.querySelector("#previewImportButton").addEventListener("click", previewImport);
document.querySelector("#applyImportButton").addEventListener("click", applyImport);
document.querySelector("#clearImportButton").addEventListener("click", clearImport);
document.querySelector("#clearWatchlistButton")?.addEventListener("click", clearWatchlist);
document.querySelector("#clearAllDataButton").addEventListener("click", clearAllData);
document.querySelector("#goalMonthlyDividendInput")?.addEventListener("input", (event) => updateDividendGoal("monthlyDividend", event.target.value));
document.querySelector("#goalStockCountInput")?.addEventListener("input", (event) => updateDividendGoal("stockCount", event.target.value));
document.querySelector("#goalDividendYieldInput")?.addEventListener("input", (event) => updateDividendGoal("dividendYield", event.target.value));
document.querySelector("#goalMarketValueInput")?.addEventListener("input", (event) => updateDividendGoal("marketValueTarget", event.target.value));
document.addEventListener("click", handleResearchMenuDocumentClick);
document.addEventListener("keydown", handleResearchMenuKeydown);
window.addEventListener("resize", closeResearchMenu);
window.addEventListener("scroll", closeResearchMenu, true);

setupSortHeaders();
setupRowSelection();
setupTabs();
applyViewMode(currentViewMode);
