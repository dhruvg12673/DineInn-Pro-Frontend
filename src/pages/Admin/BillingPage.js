import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ✅ This defines autoTable
import './Billing.css';
import {  ArrowLeft, MessageCircle } from 'lucide-react';  
const API_BASE = 'https://dineinn-pro-backend.onrender.com';

const BillingPage = () => {
  const [lastBillUrl, setLastBillUrl] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
   const billno = queryParams.get('billno');
  const tableNumber = queryParams.get('tableNumber');
  const categoryFromUrl = queryParams.get('category');
  const tableCategoryId = queryParams.get('tableCategoryId'); // This is our new TABLE category
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [menuData, setMenuData] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [billItems, setBillItems] = useState([]);
  const [newKotItems, setNewKotItems] = useState([]);
  const [orderType, setOrderType] = useState('dinein');
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [showGenerateBillModal, setShowGenerateBillModal] = useState(false);
  const [customItemForm, setCustomItemForm] = useState({ name: '', amount: '' });
  const [partialPayment, setPartialPayment] = useState({ cash: '', upi: '' });
  const [discount, setDiscount] = useState({ type: 'flat', value: 0 });
  const [paymentMode, setPaymentMode] = useState('cash');
  const [retrievedTip, setRetrievedTip] = useState(0);
  const [billFormData, setBillFormData] = useState({
    mobile: '',
    address: '',
    Name: '',
    email: '',
    specialNote: '',
    discountType: 'fixed',
    discountReason: '',
    discountValue: 0,
    gstEnabled: false,
    gstType: 'inclusive',
    cgstRate: 0,
    sgstRate: 0,
    deliveryCharge: 0,
    containerCharge: 0,
    roundOff: 0,
  });

   const [generatedPdfBase64, setGeneratedPdfBase64] = useState(null);

  const user = localStorage.getItem('user');
  let restaurantId = null;
  let staffId = null;
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      restaurantId = parsedUser.restaurantid;
      staffId = parsedUser.id;
    } catch {
      restaurantId = null;
      staffId = null;
    }
  }

// In BillingPage.js

// In BillingPage.js

// REPLACE your old fetchActiveOrder function with this one

const fetchActiveOrder = useCallback(async () => {
  if (!restaurantId) return;

  try {
    let res;
    if (billno) {
      // SCENARIO 1: Load order details using the bill number from the URL
      res = await axios.get(`${API_BASE}/api/orders/details/${billno}`, {
        params: { restaurantId },
      });
    } else if (tableNumber && tableCategoryId) {
      // SCENARIO 2: Load order details using table info (original functionality)
      res = await axios.get(`${API_BASE}/api/orders/by-table`, {
        params: { restaurantId, tableNumber, tableCategoryId },
      });
    } else {
      // This is a new order for a table, so we clear the state.
      setActiveOrder(null);
      setBillItems([]);
      return;
    }

    // This part runs for both scenarios to populate the page
    const loadedOrder = res.data;
    setActiveOrder(loadedOrder);

    if (loadedOrder && loadedOrder.id) {
      try {
        const tipRes = await axios.get(`${API_BASE}/api/tips?orderId=${loadedOrder.id}`);
        setRetrievedTip(parseFloat(tipRes.data.amount) || 0);
      } catch (tipError) {
        setRetrievedTip(0);
      }
    }

    const loadedBillItems = loadedOrder.items.map(item => ({
      id: item.menu_item_id || `custom-${item.id}`,
      name: item.item_name,
      price: parseFloat(item.price_at_order || 0),
      quantity: item.quantity,
    }));
    setBillItems(loadedBillItems);
    
    setBillFormData(prev => ({
      ...prev,
      Name: loadedOrder.customername,
      mobile: loadedOrder.customerno,
      email: loadedOrder.email_id,
    }));
    // Set the order type based on the loaded order
    setOrderType(loadedOrder.deliverytype?.toLowerCase() || 'dinein');

  } catch (err) {
    if (err.response?.status === 404) {
      setActiveOrder(null);
      setBillItems([]);
      setRetrievedTip(0);
    } else {
      console.error("Failed to fetch active order:", err);
      alert(err.response?.data?.error || 'Could not load the order.');
      navigate(-1); // Go back if there's a serious error
    }
  }
  // Add `billno` to the dependency array
}, [restaurantId, billno, tableNumber, tableCategoryId, navigate]);
  useEffect(() => {
    fetchActiveOrder();
  }, [fetchActiveOrder]);


  useEffect(() => {
    if (!restaurantId) return;
    axios.get(`${API_BASE}/api/menuitems-grouped?restaurantId=${restaurantId}&show_all=true`)
      .then(res => {
        const groupedMenu = {};
        const catKeys = [];
        res.data.forEach(group => {
          groupedMenu[group.category] = group.items;
          catKeys.push(group.category);
        });
        
        setMenuData(groupedMenu);
        setCategories(catKeys);

        if (catKeys.length > 0) {
          setSelectedCategory(categoryFromUrl && catKeys.includes(categoryFromUrl) ? categoryFromUrl : catKeys[0]);
        }
      })
      .catch(err => console.error('❌ Failed to fetch menu items:', err));
  }, [restaurantId, categoryFromUrl]);

  const filteredItems = selectedCategory && menuData[selectedCategory]
    ? menuData[selectedCategory].filter(item =>
        item.name?.toLowerCase().includes(searchTerm?.toLowerCase())
      )
    : [];

   const addItemToBill = (item) => {
    if (!item.is_available) return;
    const newItem = { ...item, quantity: 1, price: parseFloat(item.price || 0) };

    setBillItems(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
            return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, newItem];
    });

    setNewKotItems(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
            return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, newItem];
    });
  };
  useEffect(() => {
  if (restaurantId) {
    axios.get(`${API_BASE}/api/restaurants/${restaurantId}`) // Assuming you have an endpoint to get restaurant details
      .then(res => {
        setRestaurantDetails(res.data);
      })
      .catch(err => console.error('Failed to fetch restaurant details:', err));
  }
}, [restaurantId]);
  
const generateBillPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 20;

    // Helper function to format currency without spaces or superscripts
    const formatCurrency = (amount) => {
        const cleanAmount = parseFloat(amount || 0).toFixed(2);
        return `Rs.${cleanAmount}`;
    };

    // Helper function to format integers without superscripts
    const formatInteger = (value) => {
        return String(parseInt(value || 0));
    };

    // --- RESTAURANT DETAILS ---
    const restaurantName = restaurantDetails?.name || "Your Restaurant Name";
    
    const restaurantGST = restaurantDetails?.gst_number || "N/A";

    // Restaurant name with enhanced styling
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(restaurantName, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Add decorative line under restaurant name
    doc.setLineWidth(0.8);
    doc.setDrawColor(22, 160, 133);
    doc.line(pageWidth / 2 - 30, y, pageWidth / 2 + 30, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    doc.text(`GSTIN: ${restaurantGST}`, pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    // Enhanced separator line
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // --- INVOICE HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(22, 160, 133);
    doc.text("INVOICE", margin, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(new Date().toLocaleString(), pageWidth - margin, y, { align: 'right' });
    y += 12;

    // --- BILL & CUSTOMER INFO IN TWO COLUMNS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text("Bill Information", margin, y);
    doc.text("Customer Details", pageWidth / 2 + 10, y);
    y += 8;

    // Reset to normal font for details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    const leftColumnInfo = [
        ["Bill No:", activeOrder?.billno || 'N/A'],
        ["Order Type:", orderType.charAt(0).toUpperCase() + orderType.slice(1)],
        ["Table:", tableNumber || 'N/A']
    ];

    const rightColumnInfo = [
        ["Customer:", billFormData.Name || 'N/A'],
        ["Mobile:", billFormData.mobile || 'N/A'],
        ["Email:", billFormData.email || 'N/A']
    ];

    const startY = y;
    leftColumnInfo.forEach(([label, value], index) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, startY + (index * 6));
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 35, startY + (index * 6));
    });

    rightColumnInfo.forEach(([label, value], index) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, pageWidth / 2 + 10, startY + (index * 6));
        doc.setFont('helvetica', 'normal');
        doc.text(value, pageWidth / 2 + 45, startY + (index * 6));
    });

    y = startY + 24;
    
    // Enhanced separator
    doc.setLineWidth(0.3);
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- ITEMS TABLE WITH ENHANCED STYLING ---
    const tableData = billItems.map(item => [
        String(item.name),
        formatInteger(item.quantity),
        formatCurrency(item.price),
        formatCurrency(item.price * item.quantity)
    ]);

    const expandedMargin = 8; // Reduced margin for wider table
    const availableWidth = pageWidth - (expandedMargin * 2);
    
    autoTable(doc, {
        startY: y,
        head: [['Item Description', 'Qty', 'Rate', 'Amount']],
        body: tableData,
        theme: 'grid',
        margin: { left: expandedMargin, right: expandedMargin },
        tableWidth: availableWidth,
        headStyles: {
            fillColor: [22, 160, 133],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: { top: 6, right: 6, bottom: 6, left: 6 }
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
            textColor: [40, 40, 40]
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: availableWidth * 0.45 },
            1: { halign: 'center', cellWidth: availableWidth * 0.15 },
            2: { halign: 'right', cellWidth: availableWidth * 0.20 },
            3: { halign: 'right', cellWidth: availableWidth * 0.20 },
        },
        styles: {
            lineColor: [220, 220, 220],
            lineWidth: 0.3,
            overflow: 'linebreak',
            cellWidth: 'wrap',
            font: 'helvetica',
            fontStyle: 'normal'
        }
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // --- ENHANCED SUMMARY SECTION (SHIFTED MORE LEFT) ---
    const summaryStartX = pageWidth / 2 - 30; // Shifted more left
    const labelX = summaryStartX;
    const valueX = pageWidth - expandedMargin; // Use expanded margin

    // Helper function to format currency without superscripts for summary
    const cleanFormatCurrency = (amount) => {
        const cleanAmount = parseFloat(amount || 0).toFixed(2);
        return `Rs.${cleanAmount}`;
    };

    const addSummaryRow = (label, value, isBold = false, isTotal = false) => {
        if (isTotal) {
            doc.setFillColor(22, 160, 133);
            doc.rect(summaryStartX - 5, finalY - 3, pageWidth - summaryStartX - expandedMargin + 5, 10, 'F');
            doc.setTextColor(255, 255, 255);
        } else {
            doc.setTextColor(60, 60, 60);
        }
        
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(isBold ? 11 : 10);
        doc.text(String(label), labelX, finalY, { align: 'left' });
        doc.text(String(value), valueX, finalY, { align: 'right' });
        finalY += isTotal ? 10 : 6;
    };

    addSummaryRow("Subtotal", cleanFormatCurrency(calculateSubtotal()));

    if (calculateBillDiscount() > 0) {
        const discountValue = billFormData.discountType === 'percentage' ? formatInteger(billFormData.discountValue) + '%' : 'Fixed';
        const discountLabel = `Discount (${discountValue})`;
        addSummaryRow(discountLabel, `-${cleanFormatCurrency(calculateBillDiscount())}`);
    }

    if (billFormData.gstEnabled) {
        addSummaryRow(`CGST (${formatInteger(billFormData.cgstRate)}%)`, `+${cleanFormatCurrency(calculateCGST())}`);
        addSummaryRow(`SGST (${formatInteger(billFormData.sgstRate)}%)`, `+${cleanFormatCurrency(calculateSGST())}`);
    }

    if (parseFloat(billFormData.deliveryCharge || 0) > 0) {
        addSummaryRow("Delivery Charge", `+${cleanFormatCurrency(parseFloat(billFormData.deliveryCharge))}`);
    }
    if (parseFloat(billFormData.containerCharge || 0) > 0) {
        addSummaryRow("Container Charge", `+${cleanFormatCurrency(parseFloat(billFormData.containerCharge))}`);
    }

    // Separator line before total
    doc.setTextColor(60, 60, 60);
    doc.setLineWidth(0.5);
    doc.setDrawColor(22, 160, 133);
    doc.line(labelX, finalY, valueX, finalY);
    finalY += 6;

    addSummaryRow("GRAND TOTAL", cleanFormatCurrency(calculateFinalTotal()), true, true);
    finalY += 10;

    // --- ENHANCED TERMS & CONDITIONS ---
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("Terms & Conditions", margin, finalY);
    finalY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    
    const termsLines = [
        "1. Please retain this invoice for your records.",
        "2. GST is charged as per applicable rates.",
        "3. No refunds after 24 hours of purchase.",
        "4. Items once served cannot be returned.",
        "5. Management reserves the right to admission."
    ];

    termsLines.forEach((line, index) => {
        doc.text(line, margin, finalY + (index * 4));
    });
    
    finalY += termsLines.length * 4 + 8;

    // --- FOOTER ---
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.text("Thank you for your business!", pageWidth / 2, finalY, { align: 'center' });

    // --- OUTPUT ---
    const pdfBlob = doc.output('blob');
    const billUrl = URL.createObjectURL(pdfBlob);
    setLastBillUrl(billUrl); // Caching the generated URL

    return {
        pdfBlob,
        pdfBase64: doc.output('datauristring').split(',')[1],
        billUrl
    };
};
const handleSendWhatsApp = async () => {
  try {
    // Generate PDF if not already done
    let pdfToSend = generatedPdfBase64;
    if (!pdfToSend) {
      const { pdfBase64 } = generateBillPdf();
      pdfToSend = pdfBase64;
      setGeneratedPdfBase64(pdfBase64);
    }

    // Upload PDF to server
    const filename = `Bill_${activeOrder?.billno || Date.now()}.pdf`;
    const res = await axios.post(`${API_BASE}/api/upload-bill`, {
      pdfBase64: pdfToSend,
      filename,
    });

    const pdfUrl = res.data.url; // ✅ Should look like https://dineinn-pro-backend.onrender.com/bills/Bill_123.pdf

    // Sanitize phone
    const phone = billFormData.mobile?.replace(/\D/g, '');
    if (!phone) {
      alert("Customer mobile number required!");
      return;
    }

    // Encode message (IMPORTANT: don't encode the whole URL, only message parts)
    const message = `Hello ${billFormData.Name || 'Customer'}, your bill is ready.%0AView/Download here: ${pdfUrl}`;
    const waLink = `https://wa.me/${phone}?text=${message}`;

    // Open WhatsApp
    window.open(waLink, '_blank');
  } catch (err) {
    console.error("Error sending WhatsApp:", err);
    alert("Failed to send bill on WhatsApp");
  }
};

  const handleSaveAndPrint = () => {
  let billUrl = lastBillUrl;

  // Generate if not yet generated
  if (!billUrl) {
    const { billUrl: newUrl } = generateBillPdf();
    billUrl = newUrl;
  }

  const win = window.open(billUrl);
  if (win) {
    win.addEventListener('load', () => {
      win.print();
      win.onafterprint = () => win.close();
    });
  }
};





  const updateQuantity = (id, newQty) => {
    if (newQty < 1) {
        removeItem(id);
        return;
    }
    
    let qtyChange = 0;
    setBillItems(prev => prev.map(item => {
        if (item.id === id) {
            qtyChange = newQty - item.quantity;
            return { ...item, quantity: newQty };
        }
        return item;
    }));

    setNewKotItems(prev => prev.map(item => {
        if (item.id === id) {
            return { ...item, quantity: item.quantity + qtyChange };
        }
        return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
    setNewKotItems(newKotItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => billItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const calculateGST = () => calculateSubtotal() * 0.05;
  const calculateDiscount = () => {
    if (discount.type === 'flat') return parseFloat(discount.value) || 0;
    if (discount.type === 'percentage') return (calculateSubtotal() * (parseFloat(discount.value) || 0)) / 100;
    return 0;
  };
  const calculateTotal = () => calculateSubtotal() + calculateGST() - calculateDiscount();
  
  const handleSendKOT = async (andPrint = false) => {
  if (newKotItems.length === 0) {
    alert("No new items to send to the kitchen.");
    return;
  }

  const orderItemsForApi = newKotItems.map(item => ({
    menuid: item.id,
    itemname: item.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const totalOfNewItems = newKotItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const orderData = {
    restaurantid: restaurantId,
    tablenumber: tableNumber,
    categoryid: tableCategoryId,
    customername: billFormData.Name || `${tableNumber}`,
    customerno: billFormData.mobile || null,
    email_id: billFormData.email || null,
    deliverytype: orderType,
    paymenttype: 'pending',
    totalamount: totalOfNewItems,
    orderitems: orderItemsForApi,
    isoptedin: false,
    ispaid: false,
    staff_id: staffId
  };

  try {
    const response = await axios.post(`${API_BASE}/api/orders`, orderData);
    alert(`KOT sent to kitchen successfully! Bill No: ${response.data.billno}`);
    if (andPrint) {
      console.log("Printing KOT...");
    }
    setNewKotItems([]);
    
    // ✅ CRITICAL: Add 'await' to wait for the refresh to finish
    await fetchActiveOrder();

  } catch (error) {
    const errorMessage = error.response ? error.response.data.error : error.message;
    console.error('❌ Failed to send KOT:', errorMessage);
    alert(`Failed to send KOT: ${errorMessage}`);
  }
};
  // **START: ENHANCED FUNCTION WITH PDF GENERATION AND EMAIL**
  // In BillingPage.js, replace your function with this one:

const handleBillFormSubmit = async () => {
  console.log("Value of activeOrder when 'Generate' is clicked:", activeOrder);

  if (!activeOrder || !restaurantId) {
    alert('Error: No active order or restaurant ID is available.');
    return;
  }

  try {
    let pdfToSend = generatedPdfBase64;
    if (billFormData.email && !pdfToSend) {
      const { pdfBase64 } = await generateBillPdf();
      pdfToSend = pdfBase64;
    }
    
    // 1. Finalize the bill (this single call now also updates the status on the backend)
    // We removed the second, separate call to update the status.
    await axios.put(`${API_BASE}/api/orders/${activeOrder.id}/finalize`, {
      paymentMode: paymentMode,
      customername: billFormData.Name,
      customerno: billFormData.mobile,
      email_id: billFormData.email
    });
    alert(`Bill for order #${activeOrder.billno} has been finalized!`);
    
    // 2. Send email if an address and PDF content exist
    if (billFormData.email && pdfToSend) {
      await axios.post(`${API_BASE}/api/send-bill`, {
        email: billFormData.email,
        name: billFormData.Name || 'Customer',
        pdfBase64: pdfToSend,
        filename: `Bill_${activeOrder.billno || Date.now()}.pdf`
      });
      alert('Bill has been sent to the customer\'s email.');
    }
    
    // 3. Navigate back to the orders page to see the changes
    navigate(`/${restaurantId}/ordersspage`, { replace: true });

  } catch (error) {
    const errorMessage = error.response ? error.response.data.error : error.message;
    console.error('❌ Failed to finalize bill:', errorMessage);
    alert(`Failed to finalize bill: ${errorMessage}`);
  }
};  
  const handleGenerateFinalBill = () => {
    if (newKotItems.length > 0) {
      alert("You have unsent items. Please send KOT first before generating the final bill.");
      return;
    }

    // Set default GST values when opening the modal
    setBillFormData(prev => ({
      ...prev,
      gstEnabled: true, // Enable GST by default
      cgstRate: 2.5,     // Hardcode default CGST rate
      sgstRate: 2.5      // Hardcode default SGST rate
    }));

    setShowGenerateBillModal(true);
  };
  
  const handleCustomItemSubmit = () => {
    if (!customItemForm.name || !customItemForm.amount) return alert('Enter valid details');
    const newItem = {
      id: `custom-${Date.now()}`,
      name: customItemForm.name,
      price: parseFloat(customItemForm.amount || 0),
      quantity: 1,
    };
    setBillItems([...billItems, newItem]);
    setNewKotItems([...newKotItems, newItem]);
    setCustomItemForm({ name: '', amount: '' });
    setShowCustomItemModal(false);
  };
  
  const calculateBillDiscount = () => {
    if (billFormData.discountType === 'fixed') return parseFloat(billFormData.discountValue) || 0;
    if (billFormData.discountType === 'percentage') return (calculateSubtotal() * (parseFloat(billFormData.discountValue) || 0)) / 100;
    return 0;
  };
  const calculateCGST = () => {
    if (!billFormData.gstEnabled) return 0;
    const baseAmount = billFormData.gstType === 'inclusive' 
      ? calculateSubtotal() / (1 + (billFormData.cgstRate + billFormData.sgstRate) / 100) 
      : calculateSubtotal();
    return (baseAmount * billFormData.cgstRate) / 100;
  };
  const calculateSGST = () => {
    if (!billFormData.gstEnabled) return 0;
    const baseAmount = billFormData.gstType === 'inclusive' 
      ? calculateSubtotal() / (1 + (billFormData.cgstRate + billFormData.sgstRate) / 100) 
      : calculateSubtotal();
    return (baseAmount * billFormData.sgstRate) / 100;
  };
  const calculateFinalTotal = () => {
    let total = calculateSubtotal();
    total -= calculateBillDiscount();
    if (billFormData.gstEnabled && billFormData.gstType === 'exclusive') {
      total += calculateCGST() + calculateSGST();
    }
    total += parseFloat(billFormData.deliveryCharge) || 0;
    total += parseFloat(billFormData.containerCharge) || 0;
    total += parseFloat(billFormData.roundOff) || 0;
    total += retrievedTip;
    return total;
  };
    const getTotalQuantity = () => {
    return billItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="restaurant-billing">
      <div className="main-container">
        <div className="left-section">
          <div className="categories-sidebar">
            <h3>Categories</h3>
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="menu-items-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="menu-items-grid">
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  className={`menu-item-card ${item.is_available ? 'clickable' : 'unavailable'}`} 
                  onClick={() => {
                    if (item.is_available) {
                      addItemToBill(item);
                    }
                  }}
                >
                  <div className="item-icon">{item.icon || '🍽️'}</div>
                  <div className="billing-item-details">
                    <h5>{item.name}</h5>
                    {!item.is_available && <p className="unavailable-text">Item is unavailable</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="right-section">
          <div className="billing-header">
            <h2>Order Summary</h2>
            <button className="clear-btn" onClick={() => { setBillItems([]); setNewKotItems([]); }}>Clear All</button>
          </div>
          <div className="order-type-section">
            <h3>Order Type</h3>
            <div className="order-type-options">
               <label className="order-type-option">
                <input
                  type="radio"
                  name="orderType"
                  value="dinein"
                  checked={orderType === 'dinein'}
                  onChange={(e) => setOrderType(e.target.value)}
                />
                <span>Dine-In</span>
              </label>
              <label className="order-type-option">
                <input
                  type="radio"
                  name="orderType"
                  value="delivery"
                  checked={orderType === 'delivery'}
                  onChange={(e) => setOrderType(e.target.value)}
                />
                <span>Delivery</span>
              </label>
              <label className="order-type-option">
                <input
                  type="radio"
                  name="orderType"
                  value="pickup"
                  checked={orderType === 'pickup'}
                  onChange={(e) => setOrderType(e.target.value)}
                />
                <span>Pickup/Walk-in</span>
              </label>
            </div>
          </div>
           <div className="custom-item-section">
            <button 
              className="custom-item-btn"
              onClick={() => setShowCustomItemModal(true)}
            >
              + Add Custom Item
            </button>
          </div>
          <div className="bill-items">
            {billItems.length === 0 ? (
              <div className="empty-bill">
                <p>No items added yet</p>
              </div>
            ) : (
              <div className="bill-table">
                <div className="bill-header-row">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Total</span>
                  <span>Action</span>
                </div>
                
                {billItems.map(item => (
                  <div key={item.id} className="bill-item-row">
                    <span className="billing-item-name">{item.name}</span>
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <span>₹{item.price.toFixed(2)}</span>
                    <span className="item-total">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <button 
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="discount-section">
            <h3>Discount</h3>
            <div className="discount-controls">
              <div className="discount-type">
                <label>
                  <input
                    type="radio"
                    name="discountType"
                    value="flat"
                    checked={discount.type === 'flat'}
                    onChange={(e) => setDiscount({...discount, type: e.target.value})}
                  />
                  Flat Amount
                </label>
                <label>
                  <input
                    type="radio"
                    name="discountType"
                    value="percentage"
                    checked={discount.type === 'percentage'}
                    onChange={(e) => setDiscount({...discount, type: e.target.value})}
                  />
                  Percentage
                </label>
              </div>
              <input
                type="number"
                placeholder={discount.type === 'flat' ? 'Enter amount' : 'Enter %'}
                value={discount.value}
                onChange={(e) => setDiscount({...discount, value: e.target.value})}
                className="discount-input"
              />
            </div>
          </div>
          <div className="bill-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>GST (5%):</span>
              <span>₹{calculateGST().toFixed(2)}</span>
            </div>
            {calculateDiscount() > 0 && (
              <div className="summary-row">
                <span>Discount:</span>
                <span>-₹{calculateDiscount().toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total-row">
              <span>Total Amount:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
           <div className="payment-section">
            <h3>Payment Mode</h3>
            <div className="payment-modes">
              {['Cash', 'Card', 'UPI', 'Partial'].map(mode => (
                <label key={mode} className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value={mode?.toLowerCase()}
                    checked={paymentMode === mode?.toLowerCase()}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="action-buttons">
            <button className="action-btn success" onClick={handleGenerateFinalBill}>
              Generate Final Bill
            </button>
             <button className="footer-btn kot" onClick={() => handleSendKOT(false)}>KOT</button>
          </div>
        </div>
      </div>
      {showCustomItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Custom Item</h3>
            <input
              type="text"
              placeholder="Item Name/Description"
              value={customItemForm.name}
              onChange={(e) => setCustomItemForm({...customItemForm, name: e.target.value})}
              className="modal-input"
            />
            <input
              type="number"
              placeholder="Amount"
              value={customItemForm.amount}
              onChange={(e) => setCustomItemForm({...customItemForm, amount: e.target.value})}
              className="modal-input"
            />
            <div className="modal-buttons">
              <button className="modal-btn cancel" onClick={() => setShowCustomItemModal(false)}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={handleCustomItemSubmit}>
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
      {showGenerateBillModal && (
        <div className="generate-bill-modal-overlay">
          <div className="generate-bill-modal">
            <div className="bill-modal-header">
              <h2>Generate Bill</h2>
              <button 
                className="close-btn"
                onClick={() => setShowGenerateBillModal(false)}
              >
                ×
              </button>
            </div>
            <div className="bill-modal-content">
               <div className="bill-order-info">
                <div className="order-type-radios">
                  <label>
                    <input type="radio" name="modalOrderType" value="delivery" 
                           checked={orderType === 'delivery'} 
                           onChange={(e) => setOrderType(e.target.value)} />
                    Delivery
                  </label>
                  <label>
                    <input type="radio" name="modalOrderType" value="pickup" 
                           checked={orderType === 'pickup'} 
                           onChange={(e) => setOrderType(e.target.value)} />
                    Pick Up
                  </label>
                  <label>
                    <input type="radio" name="modalOrderType" value="dinein" 
                           checked={orderType === 'dinein'} 
                           onChange={(e) => setOrderType(e.target.value)} />
                    Dine In
                  </label>
                </div>
                <div className="table-info">
                </div>
              </div>
              <div className="customer-details">
                <div className="detail-row">
                  <div className="mobile-field">
                    <label>Mobile:</label>
                    <input 
                      type="text" 
                      placeholder="Enter min 10 digit no"
                      value={billFormData.mobile}
                      onChange={(e) => setBillFormData({...billFormData, mobile: e.target.value})}
                      className="mobile-input"
                    />
                    
                  </div>
                </div>
                <div className="detail-row">
                  <div className="address-field">
                    <label>Add:</label>
                    <input 
                      type="text" 
                      placeholder="Enter address"
                      value={billFormData.address}
                      onChange={(e) => setBillFormData({...billFormData, address: e.target.value})}
                      className="address-input"
                    />
                  </div>
                  <div className="locality-field">
                    <input 
                      type="text" 
                      placeholder="Enter Name"
                      value={billFormData.Name}
                      onChange={(e) => setBillFormData({...billFormData, Name: e.target.value})}
                      className="Name-input"
                    />
                  </div>
                  <div className="locality-field"> 
                    <input 
                      type="email" 
                      placeholder="Enter Email"
                      value={billFormData.email}
                      onChange={(e) => setBillFormData({...billFormData, email: e.target.value})}
                      className="Name-input" 
                    />
                  </div>
                </div>
              </div>
               <div className="special-note-section">
                <input 
                  type="text" 
                  placeholder="Special Note"
                  value={billFormData.specialNote}
                  onChange={(e) => setBillFormData({...billFormData, specialNote: e.target.value})}
                  className="special-note-input"
                />
              </div>
               <div className="items-table">
                <div className="table-header">
                  <div className="col-item">Item</div>
                  <div className="col-check">Check Item</div>
                  <div className="col-note">Special Note</div>
                  <div className="col-qty">Qty</div>
                  <div className="col-price">Price</div>
                  <div className="col-amount">Amount</div>
                </div>
                {billItems.map(item => (
                  <div key={item.id} className="table-row">
                    <div className="col-item">{item.name}</div>
                    <div className="col-check">
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="col-note">-</div>
                    <div className="col-qty">{item.quantity}</div>
                    <div className="col-price">{item.price.toFixed(2)}</div>
                    <div className="col-amount">{(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
                <div className="table-footer">
                  <div className="footer-left">
                    <span>Total Qty: {getTotalQuantity()}</span>
                  </div>
                  <div className="footer-right">
                    <span>Sub Total: {calculateSubtotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="bill-discount-section">
                <button className="discount-toggle">- Applied Discounts (less Detail)</button>
                <div className="discount-controls">
                  <button className="add-discount-btn">Add</button>
                  <div className="discount-options">
                    <label>Discount:</label>
                    <label>
                      <input 
                        type="radio" 
                        name="billDiscountType" 
                        value="percentage"
                        checked={billFormData.discountType === 'percentage'}
                        onChange={(e) => setBillFormData({...billFormData, discountType: e.target.value})}
                      />
                      Percentage
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="billDiscountType" 
                        value="fixed"
                        checked={billFormData.discountType === 'fixed'}
                        onChange={(e) => setBillFormData({...billFormData, discountType: e.target.value})}
                      />
                      Fixed
                    </label>
                    <input 
                      type="text" 
                      placeholder="Reason"
                      value={billFormData.discountReason}
                      onChange={(e) => setBillFormData({...billFormData, discountReason: e.target.value})}
                      className="discount-reason"
                    />
                    <input 
                      type="number" 
                      value={billFormData.discountValue}
                      onChange={(e) => setBillFormData({...billFormData, discountValue: e.target.value})}
                      className="discount-value"
                    />
                  </div>
                </div>
              </div>
              <div className="gst-section">
                <div className="gst-header">
                  <h3>GST Configuration</h3>
                  <label className="gst-toggle">
                    <input 
                      type="checkbox" 
                      checked={billFormData.gstEnabled}
                      onChange={(e) => setBillFormData({...billFormData, gstEnabled: e.target.checked})}
                    />
                    Enable GST
                  </label>
                </div>
                {billFormData.gstEnabled && (
                  <div className="gst-controls">
                    <div className="gst-type-selection">
                      <label>GST Type:</label>
                      <label>
                        <input 
                          type="radio" 
                          name="gstType" 
                          value="inclusive"
                          checked={billFormData.gstType === 'inclusive'}
                          onChange={(e) => setBillFormData({...billFormData, gstType: e.target.value})}
                        />
                        Inclusive
                      </label>
                      <label>
                        <input 
                          type="radio" 
                          name="gstType" 
                          value="exclusive"
                          checked={billFormData.gstType === 'exclusive'}
                          onChange={(e) => setBillFormData({...billFormData, gstType: e.target.value})}
                        />
                        Exclusive
                      </label>
                    </div>
                    <div className="gst-rates">
                      <div className="gst-rate-field">
                        <label>CGST Rate (%):</label>
                        <input type="number"
                          step="0.1"
                          value={billFormData.cgstRate}
                          onChange={(e) => setBillFormData({...billFormData, cgstRate: parseFloat(e.target.value)})}
                          className="gst-rate-input"
                        />
                      </div>
                      <div className="gst-rate-field">
                        <label>SGST Rate (%):</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={billFormData.sgstRate}
                          onChange={(e) => setBillFormData({...billFormData, sgstRate: parseFloat(e.target.value)})}
                          className="gst-rate-input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
               <div className="bill-total-section">
                <div className="total-row">
                  <span>Sub Total (₹)</span>
                  <span className="total-value">{calculateSubtotal().toFixed(2)}</span>
                </div>
                {calculateBillDiscount() > 0 && (
                  <div className="total-row">
                    <span>Discount (₹)</span>
                    <span className="discount-value">-{calculateBillDiscount().toFixed(2)}</span>
                  </div>
                )}
                {billFormData.gstEnabled && (
                  <>
                    <div className="total-row">
                      <span>CGST ({billFormData.cgstRate}%)</span>
                      <span className="gst-value">{calculateCGST().toFixed(2)}</span>
                    </div>
                    <div className="total-row">
                      <span>SGST ({billFormData.sgstRate}%)</span>
                      <span className="gst-value">{calculateSGST().toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="charges-row">
                  <span>Delivery Charge</span>
                  <input 
                    type="number" 
                    value={billFormData.deliveryCharge}
                    onChange={(e) => setBillFormData({...billFormData, deliveryCharge: e.target.value})}
                    className="charge-input"
                  />
                </div>
                <div className="charges-row">
                  <span>Container Charge</span>
                  <input 
                    type="number" 
                    value={billFormData.containerCharge}
                    onChange={(e) => setBillFormData({...billFormData, containerCharge: e.target.value})}
                    className="charge-input"
                  />
                </div>
                <div className="charges-row">
                  <span>Round Off</span>
                  <input 
                    type="number" 
                    value={billFormData.roundOff}
                    onChange={(e) => setBillFormData({...billFormData, roundOff: e.target.value})}
                    className="charge-input"
                  />
                </div>
              </div>
              <div className="order-comments">
                <label>Order Wise Comments</label>
                <textarea placeholder="Enter comments here..." className="comments-textarea"></textarea>
              </div>
              <div className="order-type-section">
                <h3>Are you willing to receive offer once a month via Email</h3>
                <div className="order-type-options">
                  {['Yes', 'No'].map(type => (
                    <label key={type} className="order-type-option">
                      <input
                        type="radio"
                        name="offerConsent"
                        value={type}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                
                {retrievedTip > 0 && (
                  <div className="total-row">
                    <span style={{ fontWeight: 'bold' }}>Guest Tip</span>
                    <span className="total-value" style={{ fontWeight: 'bold' }}>₹{retrievedTip.toFixed(2)}</span>
                  </div>
                )}
         
              
               <div className="grand-total-section">
                <div className="split-btn">Split</div>
                <div className="grand-total">
                  <span>Grand Total (₹)</span>
                  <span className="grand-total-value">{calculateFinalTotal().toFixed(2)}</span>
                </div>
                <div className="customer-paid">Customer Paid</div>
              </div>
              </div>
            </div>
            <div className="bill-modal-footer">
              <button className="footer-btn save">Save</button>
              <button className="footer-btn save-print" onClick={handleSaveAndPrint}>Save & Print</button>
              <button onClick={handleSendWhatsApp} className="footer-btn whatsapp">
  <MessageCircle size={18} /> <span>WhatsApp</span>
</button>
              <button className="footer-btn generate" onClick={handleBillFormSubmit}>Generate</button>
              <button className="footer-btn kot" onClick={() => handleSendKOT(false)}>KOT</button>
              <button className="footer-btn kot-print" onClick={() => handleSendKOT(true)}>KOT & Print</button>
              <button className="footer-btn hold">HOLD</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage