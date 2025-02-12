import { Component } from '@angular/core';

@Component({
  selector: 'app-taux',
  standalone: true,
  imports: [],
  templateUrl: './taux.component.html',
  styleUrl: './taux.component.scss'
})
export class TauxComponent {


  CurrencyRate: any = 
  [
    { slNo: 1, currency: "Alipay (Chinese Yuan)", sellRate: 0.00000, buyRate: 6.87000 },
    { slNo: 2, currency: "Nigerian Naira", sellRate: 1684.68201, buyRate: 1550.00000 },
    { slNo: 3, currency: "Paypal Usd", sellRate: 1.15000, buyRate: 0.80000 },
    { slNo: 4, currency: "Cote D'ivore (F CFA)", sellRate: 651.56454, buyRate: 624.00000 },
    { slNo: 5, currency: "Tether TRC20 USDT", sellRate: 1.00000, buyRate: 1.00000 },
    { slNo: 6, currency: "Perfect Money USD", sellRate: 1.10000, buyRate: 0.90000 },
    { slNo: 7, currency: "Mtn Mobile Money (Cameroon)", sellRate: 659.65809, buyRate: 620.00000 },
    { slNo: 8, currency: "Ghana Bank (Cedi)", sellRate: 18.32851, buyRate: 15.50000 },
    { slNo: 9, currency: "Tether BEP20 USDT", sellRate: 1.03900, buyRate: 0.90000 },
    { slNo: 10, currency: "Benin Republic (XOF)", sellRate: 685.57104, buyRate: 609.00000 },
    { slNo: 11, currency: "Tmoney (Togo)", sellRate: 625.65159, buyRate: 618.00000 },
    { slNo: 12, currency: "Zambian Kwacha", sellRate: 33.30357, buyRate: 20.00000 },
    { slNo: 13, currency: "Congolese Franc", sellRate: 3272.59762, buyRate: 2380.00000 },
    { slNo: 14, currency: "GIMACPAY", sellRate: 750.00000, buyRate: 650.00000 },
    { slNo: 15, currency: "Cameroon Bank (XAF)", sellRate: 663.12675, buyRate: 650.00000 },
    { slNo: 16, currency: "Cote d'ivoire Bank (XOF)", sellRate: 651.56454, buyRate: 630.00000 },
    { slNo: 17, currency: "Indian Rupee", sellRate: 0.00000, buyRate: 84.00000 },
    { slNo: 18, currency: "Orange Money (Cameroon)", sellRate: 663.12675, buyRate: 630.00000 },
    { slNo: 19, currency: "Burkina Faso (F CFA)", sellRate: 651.56454, buyRate: 624.00000 },
    { slNo: 20, currency: "Senegal (F CFA)", sellRate: 651.56454, buyRate: 624.00000 },
    { slNo: 21, currency: "Mali (F CFA)", sellRate: 651.56454, buyRate: 624.00000 },
    { slNo: 22, currency: "Moov (Togo)", sellRate: 625.65159, buyRate: 618.00000 },
    { slNo: 23, currency: "Pi", sellRate: 3.02083, buyRate: 2.51129 },
    { slNo: 24, currency: "Nigerian Naira (bulk)", sellRate: 1657.47681, buyRate: 1500.00000 },
    { slNo: 25, currency: "Sierra Leonean Leon (Orange Money)", sellRate: 25153.97013, buyRate: 23300.00000 }
  ];
  
}
