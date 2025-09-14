import React from "react";

type IconSaveProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

const IconSave: React.FC<IconSaveProps> = ({ title, ...props }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="#555" strokeWidth="2" fill="#fff"/>
    <path d="M7 2V7H13V2" stroke="#555" strokeWidth="2"/>
    <rect x="7" y="11" width="6" height="5" rx="1" fill="#b3e5fc" stroke="#555" strokeWidth="1"/>
  </svg>
);

export default IconSave;