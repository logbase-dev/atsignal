import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROJECT_ID = 'atsignal';
const DEFAULT_FUNCTIONS_REGION = 'asia-northeast3';

function getFunctionsBase(): string {
  if (process.env.NODE_ENV === 'development') {
    return `http://127.0.0.1:5001/${DEFAULT_PROJECT_ID}/${DEFAULT_FUNCTIONS_REGION}`;
  }
  return `https://${DEFAULT_FUNCTIONS_REGION}-${DEFAULT_PROJECT_ID}.cloudfunctions.net`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Subscribe API] 요청 받음:', { body });

    // 개발 환경에서는 Functions 에뮬레이터 직접 호출
    if (process.env.NODE_ENV === 'development') {
      const functionsUrl = `${getFunctionsBase()}/subscribeNewsletterApi`;
      
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // 프로덕션 환경에서는 Stibee API 직접 호출
    const { name, company, email, phone, inquiry, variant, privacyConsent } = body;

    // 필수 필드 검증
    if (!name || !company || !email || !phone || !privacyConsent) {
      return NextResponse.json(
        { error: 'Missing required fields', message: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format', message: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (010-1234-5678)
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format', message: '올바른 전화번호 형식을 입력해주세요. (010-0000-0000)' },
        { status: 400 }
      );
    }

    // Stibee API 호출
    const stibeeApiKey = process.env.STIBEE_API_KEY;
    const stibeeListId = process.env.STIBEE_LIST_ID;

    if (!stibeeApiKey || !stibeeListId) {
      console.error('[Subscribe API] Stibee 환경변수 누락');
      return NextResponse.json(
        { error: 'Configuration error', message: '서비스 설정에 문제가 있습니다.' },
        { status: 500 }
      );
    }

    const stibeeUrl = `https://stibee.com/api/v1.0/lists/${stibeeListId}/subscribers`;
    
    const stibeeData = {
      eventOccuredBy: 'MANUAL',
      confirmEmailYN: 'N',
      subscribers: [
        {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          $company: company.trim(),
          $phone: phone.trim(),
          $inquiry: inquiry?.trim() || '',
          $variant: variant || 'newsletter',
        }
      ]
    };

    console.log('[Subscribe API] Stibee API 호출:', { 
      url: stibeeUrl, 
      email: email.toLowerCase().trim() 
    });

    const stibeeResponse = await fetch(stibeeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AccessToken': stibeeApiKey,
      },
      body: JSON.stringify(stibeeData),
    });

    const stibeeResult = await stibeeResponse.json();

    console.log('[Subscribe API] Stibee 응답:', { 
      status: stibeeResponse.status, 
      result: stibeeResult 
    });

    if (stibeeResponse.ok) {
      return NextResponse.json({
        success: true,
        message: '구독 신청이 완료되었습니다.',
      });
    } else {
      // Stibee 에러 처리
      if (stibeeResult.Error?.Code === 'Errors.List.AlreadyExistEmail') {
        return NextResponse.json(
          { 
            error: 'ALREADY_SUBSCRIBED', 
            message: '이미 구독 중인 이메일입니다.' 
          },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { 
            error: 'STIBEE_SYNC_FAILED', 
            message: '구독 신청 중 오류가 발생했습니다.',
            detail: stibeeResult 
          },
          { status: 502 }
        );
      }
    }

  } catch (error: any) {
    console.error('[Subscribe API] 에러:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', message: '구독 신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}