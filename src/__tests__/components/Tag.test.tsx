import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Tag from '../../components/Tag';

describe('Tag Component', () => {
  const defaultProps = {
    id: 'tag-1',
    name: 'Test Tag'
  };

  // Тест на корректное отображение тега
  it('renders the tag with default props', () => {
    render(<Tag {...defaultProps} />);
    
    expect(screen.getByText(defaultProps.name)).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Иконка тега
  });

  // Тест на корректное применение цвета
  it('applies custom color', () => {
    const color = '#ff0000';
    render(<Tag {...defaultProps} color={color} />);
    
    const tagElement = screen.getByText(defaultProps.name).closest('div');
    expect(tagElement).toHaveStyle(`background-color: ${color}40`); // 40 - это 25% непрозрачности
    expect(tagElement).toHaveStyle(`border: 1px solid ${color}`);
  });

  // Тест на корректное отображение выбранного тега
  it('renders selected tag with full opacity', () => {
    const color = '#ff0000';
    render(<Tag {...defaultProps} color={color} selected />);
    
    const tagElement = screen.getByText(defaultProps.name).closest('div');
    expect(tagElement).toHaveStyle(`background-color: ${color}`); // Полная непрозрачность
  });

  // Тест на обработку клика
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Tag {...defaultProps} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText(defaultProps.name));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(defaultProps.id);
  });

  // Тест на обработку удаления
  it('handles remove events', () => {
    const handleRemove = jest.fn();
    render(<Tag {...defaultProps} onRemove={handleRemove} />);
    
    // Находим кнопку удаления по иконке
    const removeButton = screen.getAllByRole('img', { hidden: true })[1].closest('span');
    fireEvent.click(removeButton!);
    
    expect(handleRemove).toHaveBeenCalledTimes(1);
    expect(handleRemove).toHaveBeenCalledWith(defaultProps.id);
  });

  // Тест на отсутствие кнопки удаления, если не передан обработчик
  it('does not render remove button when onRemove is not provided', () => {
    render(<Tag {...defaultProps} />);
    
    // Должна быть только одна иконка (иконка тега)
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(1);
  });

  // Тест на корректное применение размера
  it('applies different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(<Tag {...defaultProps} size={size} />);
      
      const tagElement = screen.getByText(defaultProps.name).closest('div');
      
      // Проверяем, что размер применяется корректно
      // Точные значения зависят от реализации компонента
      if (size === 'small') {
        expect(tagElement).toHaveStyle('font-size: 10px');
      } else if (size === 'medium') {
        expect(tagElement).toHaveStyle('font-size: 12px');
      } else if (size === 'large') {
        expect(tagElement).toHaveStyle('font-size: 14px');
      }
      
      unmount();
    });
  });

  // Тест на корректное применение класса
  it('applies custom className', () => {
    const className = 'test-class';
    render(<Tag {...defaultProps} className={className} />);
    
    const tagElement = screen.getByText(defaultProps.name).closest('div');
    expect(tagElement).toHaveClass(className);
    expect(tagElement).toHaveClass('tag');
  });

  // Тест на корректное отображение title
  it('renders with correct title attribute', () => {
    render(<Tag {...defaultProps} />);
    
    const tagElement = screen.getByText(defaultProps.name).closest('div');
    expect(tagElement).toHaveAttribute('title', defaultProps.name);
  });

  // Тест на обрезание длинного текста
  it('truncates long tag names', () => {
    const longName = 'This is a very long tag name that should be truncated';
    render(<Tag id="tag-long" name={longName} />);
    
    const textElement = screen.getByText(longName);
    const parentElement = textElement.parentElement;
    
    expect(parentElement).toHaveStyle('overflow: hidden');
    expect(parentElement).toHaveStyle('text-overflow: ellipsis');
    expect(parentElement).toHaveStyle('white-space: nowrap');
  });
});