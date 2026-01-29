export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const RELATIVES = ['父母', '子孙', '官鬼', '妻财', '兄弟'];
export const ANIMALS = ['青龙', '朱雀', '勾陈', '腾蛇', '白虎', '玄武'];

export const LINE_SYMBOLS: Record<number, { base: string; mark: string; isMoving: boolean }> = {
  0: { base: '—————', mark: '', isMoving: false },
  1: { base: '—   —', mark: '', isMoving: false },
  2: { base: '—————', mark: 'O', isMoving: true },
  3: { base: '—   —', mark: 'X', isMoving: true },
};

// 64卦基本数据简化版 (本程序主要负责记录)
export const TRIGRAMS: Record<string, string> = {
  '111': '乾',
  '011': '兑',
  '101': '离',
  '001': '震',
  '110': '巽',
  '010': '坎',
  '100': '艮',
  '000': '坤',
};

export const getHexagramName = (lines: number[]) => {
  // 简化的卦名推导逻辑
  return "测算卦例"; 
};
