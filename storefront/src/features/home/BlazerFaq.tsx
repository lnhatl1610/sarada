import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { EditorialSection } from './EditorialSection'

const questions = [
  { question: 'Làm sao để chọn đúng kích cỡ blazer?', answer: 'Xem hướng dẫn kích cỡ và thông tin phom dáng trên trang sản phẩm. Đối chiếu số đo vai, ngực và chiều dài với chiếc áo bạn đang mặc vừa; nếu còn phân vân, hãy liên hệ để được tư vấn.' },
  { question: 'Tôi có thể xem chất liệu ở đâu?', answer: 'Thông tin chất liệu và mô tả nằm trên trang chi tiết của từng sản phẩm. Hãy kiểm tra thông tin này trước khi chọn mua vì mỗi thiết kế có thể sử dụng chất liệu khác nhau.' },
  { question: 'Phí vận chuyển được tính như thế nào?', answer: 'Phí vận chuyển và tổng thanh toán được hiển thị ở bước thanh toán theo địa chỉ nhận hàng và điều kiện áp dụng cho đơn hàng của bạn.' },
  { question: 'Có những phương thức thanh toán nào?', answer: 'Các phương thức đang được cửa hàng hỗ trợ sẽ hiển thị tại bước thanh toán. Chọn phương thức phù hợp và kiểm tra lại thông tin trước khi xác nhận đặt hàng.' },
  { question: 'Tôi cần làm gì nếu muốn đổi hoặc trả hàng?', answer: 'Kiểm tra chính sách đổi trả áp dụng cho sản phẩm và liên hệ cửa hàng kèm mã đơn hàng. Điều kiện, thời hạn và hướng xử lý sẽ được xác nhận theo chính sách hiện hành.' },
  { question: 'Tôi có thể lưu những sản phẩm yêu thích không?', answer: 'Bạn có thể dùng biểu tượng yêu thích trên sản phẩm và truy cập tài khoản để xem lại danh sách. Hệ thống sẽ hướng dẫn đăng nhập nếu cần.' },
]

export function BlazerFaq() {
  return <div id="faq" className="scroll-mt-8">
    <EditorialSection id="blazer-faq-title" eyebrow="A LITTLE HELP" title="Bạn hỏi, chúng tôi lắng nghe">
      <div className="[display:grid] grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <div className="flex flex-col items-start gap-5"><p className="text-sm leading-7 text-muted-foreground">Từ việc chọn chiếc blazer đầu tiên đến chăm sóc trang phục mỗi ngày. Chúng tôi luôn sẵn sàng giúp bạn tìm câu trả lời.</p><Link to="/contact" className="flex items-center gap-2 border-b pb-2 text-sm">Liên hệ tư vấn <ArrowUpRight className="size-4" aria-hidden="true" /></Link></div>
        <Accordion type="single" collapsible>{questions.map((item, index) => <AccordionItem key={item.question} value={`question-${index}`}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent><p className="leading-7 text-muted-foreground">{item.answer}</p></AccordionContent></AccordionItem>)}</Accordion>
      </div>
    </EditorialSection>
  </div>
}
