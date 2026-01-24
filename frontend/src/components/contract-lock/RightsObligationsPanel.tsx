import React, { useState } from 'react';
import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineShieldCheck,
  HiOutlineExclamation,
} from 'react-icons/hi';
import { RightObligationItem, Party, Importance } from '../../types/contract-lock';

interface Props {
  items: RightObligationItem[];
  isLoading?: boolean;
  selectedParty?: Party | 'all';
  onPartyChange?: (party: Party | 'all') => void;
}

const importanceColors: Record<Importance, { bg: string; badge: string; text: string }> = {
  low: { bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', text: 'Rendah' },
  medium: { bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', text: 'Sedang' },
  high: { bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', text: 'Tinggi' },
  critical: { bg: 'bg-red-50', badge: 'bg-red-100 text-red-800', text: 'Kritis' },
};

const typeIcons = {
  right: <HiOutlineShieldCheck className="text-green-600" />,
  obligation: <HiOutlineExclamation className="text-blue-600" />,
};

const typeLabels = {
  right: 'Hak',
  obligation: 'Kewajiban',
};

export const RightsObligationsPanel: React.FC<Props> = ({
  items,
  isLoading = false,
  selectedParty = 'all',
  onPartyChange,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filteredItems =
    selectedParty === 'all' ? items : items.filter((item) => item.party === selectedParty);

  const rightItems = filteredItems.filter((item) => item.type === 'right');
  const obligationItems = filteredItems.filter((item) => item.type === 'obligation');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hak & Kewajiban Kontrak</h3>

        {/* Party Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'Contractor', 'ProjectOwner'] as const).map((party) => (
            <button
              key={party}
              onClick={() => onPartyChange?.(party)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedParty === party
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {party === 'all' ? 'Semua' : party === 'Contractor' ? 'Kontraktor' : 'Pemilik Proyek'}
            </button>
          ))}
        </div>
      </div>

      {/* Rights Section */}
      {rightItems.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineShieldCheck className="text-green-600 text-xl" />
            <h4 className="text-base font-semibold text-gray-900">
              Hak ({rightItems.length})
            </h4>
          </div>

          <div className="space-y-3">
            {rightItems.map((item) => (
              <RightObligationItemComponent
                key={item.itemId}
                item={item}
                isExpanded={expandedItems.has(item.itemId)}
                onToggle={() => toggleItem(item.itemId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Obligations Section */}
      {obligationItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineExclamation className="text-blue-600 text-xl" />
            <h4 className="text-base font-semibold text-gray-900">
              Kewajiban ({obligationItems.length})
            </h4>
          </div>

          <div className="space-y-3">
            {obligationItems.map((item) => (
              <RightObligationItemComponent
                key={item.itemId}
                item={item}
                isExpanded={expandedItems.has(item.itemId)}
                onToggle={() => toggleItem(item.itemId)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <p>Tidak ada hak atau kewajiban untuk pihak yang dipilih</p>
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">Total Hak</p>
            <p className="text-2xl font-bold text-green-700">{rightItems.length}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">Total Kewajiban</p>
            <p className="text-2xl font-bold text-blue-700">{obligationItems.length}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">Total Item</p>
            <p className="text-2xl font-bold text-purple-700">{filteredItems.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ItemProps {
  item: RightObligationItem;
  isExpanded: boolean;
  onToggle: () => void;
}

const RightObligationItemComponent: React.FC<ItemProps> = ({ item, isExpanded, onToggle }) => {
  const colors = importanceColors[item.importance];

  return (
    <div className={`${colors.bg} rounded-lg border border-gray-200 overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-opacity-75 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          <div className="text-2xl">{typeIcons[item.type]}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-gray-900">{item.description}</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}>
                {importanceColors[item.importance].text}
              </span>
            </div>
            <p className="text-sm text-gray-600">{item.party}</p>
          </div>
        </div>
        {isExpanded ? (
          <HiOutlineChevronUp className="text-gray-600 text-xl flex-shrink-0" />
        ) : (
          <HiOutlineChevronDown className="text-gray-600 text-xl flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-200 bg-opacity-50">
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 uppercase mb-1">Detail</p>
            <p className="text-sm text-gray-800">{item.details}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Referensi Kontrak: <code className="text-gray-700">{item.contractReference}</code>
            </span>
            <span className={`px-3 py-1 rounded text-xs font-medium ${colors.badge}`}>
              {typeLabels[item.type]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
