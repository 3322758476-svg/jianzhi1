// Supabase Edge Function - 发送歡迎郵件
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// 郵件模板
const WELCOME_EMAIL_TEMPLATE = {
  student: {
    subject: "歡迎加入大學生兼職平台！",
    html: (username: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>歡迎加入大學生兼職平台！</h1>
          </div>
          <div class="content">
            <h2>親愛的 ${username} 同學，</h2>
            <p>感謝您註冊大學生兼職平台！我們很高興您選擇加入我們的社區。</p>
            
            <h3>🎯 平台特色</h3>
            <ul>
              <li>個性化崗位推薦</li>
              <li>企業實名認證保障</li>
              <li>靈活的工作時間安排</li>
              <li>積累寶貴工作經驗</li>
            </ul>
            
            <p>立即登錄平台，開始您的兼職之旅吧！</p>
            
            <a href="https://your-domain.com/login" class="button">立即登錄</a>
            
            <p>如果您有任何問題，請隨時聯繫我們的客服團隊。</p>
            
            <p>祝您使用愉快！</p>
            <p><strong>大學生兼職平台團隊</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  company: {
    subject: "歡迎企業入駐大學生兼職平台！",
    html: (companyName: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>歡迎企業入駐大學生兼職平台！</h1>
          </div>
          <div class="content">
            <h2>尊敬的 ${companyName}，</h2>
            <p>感謝您選擇大學生兼職平台作為招聘合作夥伴！</p>
            
            <h3>🎯 平台優勢</h3>
            <ul>
              <li>優質的大學生人才庫</li>
              <li>精準的崗位匹配推薦</li>
              <li>高效的招聘流程</li>
              <li>專業的客服支持</li>
            </ul>
            
            <p>立即登錄平台，發布您的第一個兼職崗位！</p>
            
            <a href="https://your-domain.com/login" class="button">立即登錄</a>
            
            <p>如果您在招聘過程中遇到任何問題，我們的團隊將竭誠為您服務。</p>
            
            <p>期待與您合作！</p>
            <p><strong>大學生兼職平台團隊</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

export default async function handler(req: Request) {
  // 設置CORS頭
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });

  // 處理OPTIONS請求（CORS預檢）
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // 只允許POST請求
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const { email, username, userType } = await req.json();

    if (!email || !username || !userType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers }
      );
    }

    // 在實際環境中，這裡應該調用郵件服務API
    // 例如：SendGrid、Mailgun、或Supabase自帶的郵件服務
    
    const template = WELCOME_EMAIL_TEMPLATE[userType as 'student' | 'company'];
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Invalid user type' }),
        { status: 400, headers }
      );
    }

    // 模擬郵件發送（在實際環境中需要配置真實的郵件服務）
    console.log('📧 郵件發送日誌:', {
      to: email,
      subject: template.subject,
      userType,
      username,
      timestamp: new Date().toISOString()
    });

    // 返回成功響應
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        data: {
          email,
          username,
          userType,
          subject: template.subject
        }
      }),
      { headers }
    );

  } catch (error) {
    console.error('郵件發送錯誤:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    );
  }
}