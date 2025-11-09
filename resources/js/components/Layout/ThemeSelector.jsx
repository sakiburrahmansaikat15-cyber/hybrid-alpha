// components/Layout/ThemeSelector.jsx
import { useTheme } from '../../hooks/useTheme';
import { IconMapper } from '../UI/IconMapper';

const ThemeSelector = () => {
  const { theme, toggleTheme, color, setColor } = useTheme();

  const colorThemes = [
    { name: 'Blue', value: 'blue', class: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Purple', value: 'purple', class: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { name: 'Green', value: 'green', class: 'bg-gradient-to-r from-green-500 to-green-600' },
    { name: 'Red', value: 'red', class: 'bg-gradient-to-r from-red-500 to-red-600' },
    { name: 'Orange', value: 'orange', class: 'bg-gradient-to-r from-orange-500 to-orange-600' },
  ];

  return (
    <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={toggleTheme}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <IconMapper name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
        <span className="text-sm font-medium">
          {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </span>
      </button>

      <div className="flex items-center space-x-2">
        <IconMapper name="Palette" size={18} className="text-gray-500" />
        <div className="flex space-x-1">
          {colorThemes.map((colorTheme) => (
            <button
              key={colorTheme.value}
              onClick={() => setColor(colorTheme.value)}
              className={`w-8 h-8 rounded-full ${colorTheme.class} border-2 ${
                color === colorTheme.value 
                  ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-400' 
                  : 'border-transparent'
              } transition-all hover:scale-110 relative`}
              title={colorTheme.name}
            >
              {color === colorTheme.value && (
                <IconMapper name="Check" size={14} className="text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;