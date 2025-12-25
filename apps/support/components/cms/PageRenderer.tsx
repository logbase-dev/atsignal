interface PageRendererProps {
  data: any;
  locale: string;
}

export default function PageRenderer({ data, locale }: PageRendererProps) {
  return (
    <div>
      <h1>{data.title || "Page"}</h1>
      <p>Locale: {locale}</p>
    </div>
  );
}

