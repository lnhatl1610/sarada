import { NewsletterForm } from "./NewsletterForm";
export function BlazerNewsletter() {
  return (
    <section
      aria-labelledby="blazer-newsletter-title"
      className="grid md:grid-cols-2"
    >
      <img
        src="/blazer-look-2-hd.webp"
        alt="Phong cách thanh lịch cùng Sarada"
        loading="lazy"
        decoding="async"
        width="1122"
        height="1402"
        className="max-h-140 w-full object-cover object-[center_35%]"
      />
      <div className="flex flex-col justify-center gap-6 bg-muted px-6 py-16 md:px-12 lg:px-20">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Câu chuyện tiếp theo, dành cho bạn
        </p>
        <h2
          id="blazer-newsletter-title"
          className="font-sans text-4xl md:text-5xl"
        >
          Giảm 10% cho
          <br />
          đơn hàng đầu tiên
        </h2>
        <p className="max-w-md text-sm leading-7 text-muted-foreground">
          Đăng ký email để nhận ưu đãi độc quyền, thông tin bộ sưu tập mới và
          quà tặng sinh nhật.
        </p>
        <div className="[&_input[type=email]]:w-full [&_input[type=email]]:border-b [&_input[type=email]]:bg-transparent [&_input[type=email]]:p-3 [&_button]:p-3 [&_button]:font-medium [&_label]:text-xs [&_.newsletter-fields]:flex [&_.newsletter-consent]:mt-4 [&_.newsletter-consent]:flex [&_.newsletter-consent]:gap-2">
          <NewsletterForm storeName="Sarada" idPrefix="blazer-newsletter" />
        </div>
        <p className="text-[10px] leading-5 text-muted-foreground">
          Ưu đãi minh họa; điều kiện chính thức do cửa hàng xác nhận. Bạn có thể
          hủy đăng ký bất cứ lúc nào.
        </p>
      </div>
    </section>
  );
}
