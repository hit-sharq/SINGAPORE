'use client'

export default function Loading() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && systemDark)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            })();
          `,
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          html.dark { color-scheme: dark; }
          .loading-spinner { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `
      }} />
      <div className="min-h-screen bg-[#111210] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-[#d8a85b]/10 mb-4">
            <svg className="size-6 text-[#d8a85b] loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[#878981]">Loading Singapore Club...</p>
        </div>
      </div>
    </>
  )
}