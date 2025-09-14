import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Icon, { IconType } from '../../components/Icon';

describe('Icon Component', () => {
  // Тест на корректное отображение иконки
  it('renders the icon with default props', () => {
    render(<Icon type="bookmark" />);
    const svgElement = screen.getByRole('img', { hidden: true });
    
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe('svg');
    expect(svgElement).toHaveAttribute('width', '16');
    expect(svgElement).toHaveAttribute('height', '16');
  });

  // Тест на корректное применение размера
  it('applies custom size', () => {
    const size = 24;
    render(<Icon type="bookmark" size={size} />);
    const svgElement = screen.getByRole('img', { hidden: true });
    
    expect(svgElement).toHaveAttribute('width', size.toString());
    expect(svgElement).toHaveAttribute('height', size.toString());
  });

  // Тест на корректное применение цвета
  it('applies custom color', () => {
    const color = '#ff0000';
    render(<Icon type="bookmark" color={color} />);
    const svgElement = screen.getByRole('img', { hidden: true });
    
    expect(svgElement).toHaveAttribute('fill', color);
  });

  // Тест на корректное применение класса
  it('applies custom className', () => {
    const className = 'test-class';
    render(<Icon type="bookmark" className={className} />);
    const svgElement = screen.getByRole('img', { hidden: true });
    
    expect(svgElement).toHaveClass(className);
    expect(svgElement).toHaveClass('icon');
    expect(svgElement).toHaveClass('icon-bookmark');
  });

  // Тест на обработку клика
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Icon type="bookmark" onClick={handleClick} />);
    const svgElement = screen.getByRole('img', { hidden: true });
    
    fireEvent.click(svgElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Тест на корректное отображение курсора при наличии обработчика клика
  it('shows pointer cursor when onClick is provided', () => {
    const handleClick = jest.fn();
    render(<Icon type="bookmark" onClick={handleClick} />);
    const svgElement = screen.getByRole('img', { hidden: true });
    
    expect(svgElement).toHaveStyle('cursor: pointer');
  });

  // Тест на корректное отображение курсора при отсутствии обработчика клика
  it('shows default cursor when onClick is not provided', () => {
    render(<Icon type="bookmark" />);
    const svgElement = screen.getByRole('img', { hidden: true });
    
    expect(svgElement).toHaveStyle('cursor: default');
  });

  // Тест на отображение всех типов иконок
  it('renders all icon types', () => {
    const iconTypes: IconType[] = [
      'bookmark',
      'folder',
      'folder-open',
      'checkbox',
      'checkbox-checked',
      'move',
      'copy',
      'delete',
      'clear',
      'search',
      'tag',
      'edit',
      'preview',
      'note',
      'close'
    ];
    
    iconTypes.forEach(type => {
      const { unmount } = render(<Icon type={type} />);
      const svgElement = screen.getByRole('img', { hidden: true });
      
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveClass(`icon-${type}`);
      
      unmount();
    });
  });
});