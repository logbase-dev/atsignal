   // apps/web/app/[locale]/Resources/Onboarding@signal/page.tsx
   import Image from 'next/image';

   export default function OnboardingSignalPage() {
     return (
       <section className="section section-gray">
         <div className="section-container">
           <h1 className="section-title">Onboarding@signal</h1>
           <p className="section-description">
             신규 사용자가 빠르게 AtSignal을 이해하고 활용할 수 있도록 돕는 온보딩 가이드입니다.
           </p>
           <div style={{ maxWidth: 960, margin: '2rem auto' }}>
             <Image
               src="/images/onborading.png"
               alt="Onboarding overview"
               width={960}
               height={540}
               style={{
                 width: '100%',
                 height: 'auto',
                 borderRadius: '1rem',
                 boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
               }}
               priority
             />
           </div>
           <p className="section-description">
             {/* 필요하다면 추가 텍스트/콘텐츠 */}
           </p>
         </div>
       </section>
     );
   }