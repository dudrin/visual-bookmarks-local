import React from "react";

type IconCheckProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

const IconCheck: React.FC<IconCheckProps> = ({ title, ...props }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    {...props}
    xmlns="http://www.w3.org/2000/svg"
  >
    {title ? <title>{title}</title> : null}
    <circle cx="10" cy="10" r="9" stroke="#27ae60" strokeWidth="2" fill="#eafaf1"/>
    <path d="M6 10.5L9 13.5L14 7.5" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default IconCheck;