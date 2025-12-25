export default function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={footerContainerStyle}>
        <div style={footerContentStyle}>
          <div style={footerSectionStyle}>
            <h3 style={footerTitleStyle}>Documentation</h3>
            <ul style={footerListStyle}>
              <li>
                <a href="/ko/administrator" style={footerLinkStyle}>
                  Administrator
                </a>
              </li>
              <li>
                <a href="/ko/onboarding-guide" style={footerLinkStyle}>
                  Onboarding guide
                </a>
              </li>
              <li>
                <a href="/ko/integration" style={footerLinkStyle}>
                  Integration
                </a>
              </li>
              <li>
                <a href="/ko/api" style={footerLinkStyle}>
                  API
                </a>
              </li>
            </ul>
          </div>
          <div style={footerSectionStyle}>
            <h3 style={footerTitleStyle}>Resources</h3>
            <ul style={footerListStyle}>
              <li>
                <a href="/ko/data-structure" style={footerLinkStyle}>
                  Data structure
                </a>
              </li>
              <li>
                <a href="/ko/technical-tips" style={footerLinkStyle}>
                  Technical tips
                </a>
              </li>
              <li>
                <a href="/ko/benchmark" style={footerLinkStyle}>
                  Benchmark
                </a>
              </li>
            </ul>
          </div>
          <div style={footerSectionStyle}>
            <h3 style={footerTitleStyle}>Company</h3>
            <ul style={footerListStyle}>
              <li>
                <a href="https://atsignal.io" style={footerLinkStyle} target="_blank" rel="noopener noreferrer">
                  AtSignal
                </a>
              </li>
              <li>
                <a href="https://atsignal.io/about" style={footerLinkStyle} target="_blank" rel="noopener noreferrer">
                  About
                </a>
              </li>
              <li>
                <a href="https://atsignal.io/contact" style={footerLinkStyle} target="_blank" rel="noopener noreferrer">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div style={footerBottomStyle}>
          <p style={footerCopyrightStyle}>© 2025 AtSignal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

const footerStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #e5e7eb',
  marginTop: '4rem',
};

const footerContainerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '3rem 1.5rem 1.5rem',
};

const footerContentStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '2rem',
  marginBottom: '2rem',
};

const footerSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const footerTitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '1rem',
  margin: 0,
};

const footerListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const footerLinkStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#6b7280',
  textDecoration: 'none',
  transition: 'color 0.2s',
};

const footerBottomStyle: React.CSSProperties = {
  paddingTop: '2rem',
  borderTop: '1px solid #e5e7eb',
};

const footerCopyrightStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#6b7280',
  margin: 0,
};

