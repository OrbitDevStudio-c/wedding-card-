import { useRef } from 'react';
import { useInView } from '../hooks/useInView.js';

export function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const visible = useInView(ref);
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { ...style, '--delay': `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
