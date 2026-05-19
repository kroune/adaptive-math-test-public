interface Props {
  search: string;
  setSearch: (s: string) => void;
  modeFilter: string;
  setModeFilter: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  dateFrom: string;
  setDateFrom: (s: string) => void;
  dateTo: string;
  setDateTo: (s: string) => void;
  filteredCount: number;
  totalCount: number;
}

export default function SessionsFilters({
  search, setSearch,
  modeFilter, setModeFilter,
  statusFilter, setStatusFilter,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  filteredCount, totalCount,
}: Props) {
  const hasFilters = search || modeFilter || statusFilter || dateFrom || dateTo;

  const reset = () => {
    setSearch('');
    setModeFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4 space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Поиск</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Имя, фамилия, школа..."
            className="w-full px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Режим</label>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Все</option>
            <option value="adaptive">Адаптивный</option>
            <option value="nonadaptive">Автоматический</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Статус</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Все</option>
            <option value="finished">Завершён</option>
            <option value="active">В процессе</option>
            <option value="early_exit">Досрочный выход</option>
            <option value="force_terminated">Принудительно завершён</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">С</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">По</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        {hasFilters && (
          <button
            onClick={reset}
            className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
          >
            Сбросить
          </button>
        )}
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500">
        Найдено: {filteredCount} из {totalCount}
      </div>
    </div>
  );
}
