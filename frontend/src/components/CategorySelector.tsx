import React from 'react';
import {
  Cone,
  Trash2,
  Zap,
  Droplets,
  Building2,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { CIVIC_CATEGORIES, UI_TEXT } from '../utils/translations';

const ICON_MAP: Record<string, LucideIcon> = {
  Road: Cone,
  Trash2: Trash2,
  Zap: Zap,
  Droplets: Droplets,
  Building2: Building2,
  AlertCircle: AlertCircle,
};

interface CategorySelectorProps {
  language: LanguageCode;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  language,
  selectedCategory,
  onSelectCategory,
}) => {
  const t = UI_TEXT[language];

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-200">
        {t.selectCategoryTitle}
      </label>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {CIVIC_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || AlertCircle;
          const isSelected =
            selectedCategory === cat.labelEn || selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.labelEn)}
              className={`p-3 rounded-xl text-left transition-all border flex items-start gap-3 ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/40 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                  : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div
                  className={`text-xs font-semibold truncate ${
                    isSelected ? 'text-cyan-300' : 'text-slate-200'
                  }`}
                >
                  {language === 'hi' ? cat.labelHi : cat.labelEn}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {language === 'hi' ? cat.descriptionHi : cat.descriptionEn}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
