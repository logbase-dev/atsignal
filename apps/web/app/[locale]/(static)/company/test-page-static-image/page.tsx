import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company - Test Page Static Image",
  description: "atsignal Test Page Static Image",
};

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SolutionsPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingBottom: '1rem' }}>
        {/* Hero 섹션 div default start */}
        <div className="hero-page">
            <div className="hero-page-container" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap', padding: '8rem 1rem', paddingTop: '8rem' }}>
            <div style={{ flexShrink: 0, maxWidth: '20%', minWidth: '150px', position: 'relative', marginTop: '-1rem' }}>
                <img
                src="/images/blog_image.jpg"
                alt="atsignal blogs"
                style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                />
            </div>
            <div style={{ flex: 1, minWidth: '300px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>atsignal Test pageg Static Image</h1>
                <p>atsignal Test Page Static Image 입니다.</p>
            </div>
            </div>
        </div>
        {/* Hero 섹션 div default end */}


        {/* 본문 내용 div start */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '4rem', backgroundColor: '#ffffff' }}>
          
          {/* 첫 번째 행: 이미지(col-4) + 텍스트(col-8) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', marginBottom: '4rem', alignItems: 'center', border: '1px solid #e5e7eb', padding: '2rem', borderRadius: '12px' }}>
            {/* 이미지 영역 (col-4) */}
            <div style={{ gridColumn: 'span 4' }}>
              <img 
                src="/images/0001.png" 
                alt="Sample Image 1" 
                style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              />
            </div>
            {/* 텍스트 영역 (col-8) */}
            <div style={{ gridColumn: 'span 8' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>첫 번째 섹션 제목</h2>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#4b5563' }}>
                여기에 첫 번째 섹션의 설명 텍스트가 들어갑니다. 
                이미지가 왼쪽에 배치되고 텍스트가 오른쪽에 배치되는 레이아웃입니다.
              </p>
            </div>
          </div>

          {/* 두 번째 행: 텍스트(col-8) + 이미지(col-4) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', marginBottom: '4rem', alignItems: 'center', border: '1px solid #e5e7eb', padding: '2rem', borderRadius: '12px' }}>
            {/* 텍스트 영역 (col-8) */}
            <div style={{ gridColumn: 'span 8' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>두 번째 섹션 제목</h2>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#4b5563' }}>
                여기에 두 번째 섹션의 설명 텍스트가 들어갑니다. 
                텍스트가 왼쪽에 배치되고 이미지가 오른쪽에 배치되는 레이아웃입니다.
              </p>
            </div>
            {/* 이미지 영역 (col-4) */}
            <div style={{ gridColumn: 'span 4' }}>
              <img 
                src="/images/0004.png" 
                alt="Sample Image 2" 
                style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              />
            </div>
          </div>

          {/* 세 번째 행: 이미지(col-4) + 텍스트(col-8) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', marginBottom: '4rem', alignItems: 'center', border: '1px solid #e5e7eb', padding: '2rem', borderRadius: '12px' }}>
            {/* 이미지 영역 (col-4) */}
            <div style={{ gridColumn: 'span 4' }}>
              <img 
                src="/images/0010.png" 
                alt="Sample Image 3" 
                style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              />
            </div>
            {/* 텍스트 영역 (col-8) */}
            <div style={{ gridColumn: 'span 8' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>세 번째 섹션 제목</h2>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#4b5563' }}>
                여기에 세 번째 섹션의 설명 텍스트가 들어갑니다. 
                이미지가 왼쪽에 배치되고 텍스트가 오른쪽에 배치되는 레이아웃입니다.
              </p>
            </div>
          </div>

        </div>
        {/* 본문 내용 div end */}
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

