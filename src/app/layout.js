// app/layout.js
import './globals.css';

export const metadata = {
  title: 'Forex Currency Strength Correlation App',
  description:
    'แสดงความสัมพันธ์ของความแข็งแกร่งสกุลเงินเดี่ยว (ค่า -10 ถึง 10)',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
