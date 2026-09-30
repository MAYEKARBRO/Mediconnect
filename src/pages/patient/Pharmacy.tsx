import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pill, Search, Plus, Trash2, ShoppingCart, CreditCard, Smartphone, Wallet, Banknote, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data
const MEDICINES = [
    { id: '1', name: 'Paracetamol 500mg', company: 'MediPharma', price: 5.00, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200' },
    { id: '2', name: 'Amoxicillin 250mg', company: 'HealthCare Inc', price: 12.50, image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=200' },
    { id: '3', name: 'Vitamin C 1000mg', company: 'NutriLife', price: 8.00, image: 'https://images.unsplash.com/photo-1550572017-ed108bc272n9?auto=format&fit=crop&q=80&w=200' },
    { id: '4', name: 'Ibuprofen 400mg', company: 'PainRelief', price: 7.50, image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=200' },
    { id: '5', name: 'Cetirizine 10mg', company: 'AllergyFree', price: 4.00, image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=200' },
    { id: '6', name: 'Aspirin 75mg', company: 'HeartGuard', price: 3.50, image: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=200' },
];

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

const Pharmacy = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);

    // Mock Form State
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        paymentMethod: 'upi'
    });

    const filteredMedicines = MEDICINES.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addToCart = (medicine: typeof MEDICINES[0]) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === medicine.id);
            if (existing) {
                return prev.map(item => item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { id: medicine.id, name: medicine.name, price: medicine.price, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleConfirmOrder = () => {
        // Here you would normally integrate with an API
        setIsCheckoutOpen(false);
        setIsOrderConfirmed(true);
        setCart([]);
        setFormData({ name: '', address: '', phone: '', email: '', paymentMethod: 'upi' });
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 p-2">

            {/* Main Content - Medicine Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-6 flex gap-4 items-center sticky top-0 bg-gray-50 z-10 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy Store</h1>
                    <div className="flex-1 relative max-w-md ml-auto">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search medicines..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {filteredMedicines.map(item => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <div className="h-40 bg-white flex items-center justify-center relative">
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                <Button
                                    size="sm"
                                    className="absolute bottom-2 right-2 rounded-full w-8 h-8 p-0"
                                    onClick={() => addToCart(item)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-lg text-gray-900 truncate">{item.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{item.company}</p>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-600">${item.price.toFixed(2)}</span>
                                    {cart.find(c => c.id === item.id) ? (
                                        <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> In Cart
                                        </span>
                                    ) : (
                                        <Button variant="outline" size="sm" onClick={() => addToCart(item)}>Add</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right Sidebar - Cart */}
            <div className="w-full lg:w-96 bg-white border rounded-lg shadow-sm flex flex-col h-full sticky top-0">
                <div className="p-4 border-b bg-gray-50 rounded-t-lg flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-blue-600" /> Your Cart
                    </h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {cart.length} Items
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                            <ShoppingCart className="h-12 w-12 opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 items-center bg-gray-50 p-3 rounded-md">
                                <div className="h-10 w-10 bg-white rounded flex items-center justify-center border">
                                    <Pill className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="w-6 h-6 flex items-center justify-center bg-white border rounded hover:bg-gray-100"
                                        onClick={() => updateQuantity(item.id, -1)}
                                    >
                                        -
                                    </button>
                                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                                    <button
                                        className="w-6 h-6 flex items-center justify-center bg-white border rounded hover:bg-gray-100"
                                        onClick={() => updateQuantity(item.id, 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    className="text-red-500 hover:text-red-700 p-1"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-lg space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={cart.length === 0}
                        onClick={() => setIsCheckoutOpen(true)}
                    >
                        Proceed with Order
                    </Button>
                </div>
            </div>

            {/* Checkout Modal */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold">Checkout & Payment</h2>
                                <button onClick={() => setIsCheckoutOpen(false)}><X className="h-6 w-6 text-gray-400 hover:text-gray-600" /></button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Shipping Details */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Shipping Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-gray-700 block mb-1">Full Name</label>
                                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-gray-700 block mb-1">Delivery Address</label>
                                            <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="123 Health St, Medical City" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-700 block mb-1">Phone Number</label>
                                            <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 234 567 890" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-700 block mb-1">Email</label>
                                            <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method Details */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Payment Portal</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'upi', label: 'UPI', icon: Smartphone },
                                            { id: 'mastercard', label: 'Mastercard', icon: CreditCard },
                                            { id: 'neft', label: 'NEFT / NFT (Internal)', icon: Banknote },
                                            { id: 'razorpay', label: 'Razorpay', icon: Wallet }
                                        ].map(method => (
                                            <div
                                                key={method.id}
                                                onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                                                className={`cursor-pointer p-4 border rounded-lg flex items-center gap-3 transition-colors ${formData.paymentMethod === method.id
                                                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                        : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <method.icon className={`h-5 w-5 ${formData.paymentMethod === method.id ? 'text-blue-600' : 'text-gray-500'}`} />
                                                <span className="font-medium text-sm">{method.label}</span>
                                                {formData.paymentMethod === method.id && <CheckCircle className="h-4 w-4 ml-auto text-blue-600" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mock Payment Fields based on method */}
                                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                                    {formData.paymentMethod === 'upi' && (
                                        <Input placeholder="Enter UPI ID (e.g. user@bank)" className="bg-white" />
                                    )}
                                    {formData.paymentMethod === 'mastercard' && (
                                        <div className="space-y-3">
                                            <Input placeholder="Card Number" className="bg-white" />
                                            <div className="flex gap-3">
                                                <Input placeholder="MM/YY" className="bg-white" />
                                                <Input placeholder="CVV" className="bg-white" />
                                            </div>
                                        </div>
                                    )}
                                    {formData.paymentMethod === 'neft' && (
                                        <p>Bank details will be displayed for checking out via NEFT.</p>
                                    )}
                                    {formData.paymentMethod === 'razorpay' && (
                                        <p>You will be redirected to Razorpay secure gateway.</p>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                                <Button className="bg-green-600 hover:bg-green-700 px-8" onClick={handleConfirmOrder}>
                                    Confirm Order (${cartTotal.toFixed(2)})
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order Confirmed Popup */}
            <AnimatePresence>
                {isOrderConfirmed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsOrderConfirmed(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
                            <p className="text-gray-600">Your medicines will be delivered to your registered address shortly.</p>
                            <Button
                                className="w-full mt-4"
                                onClick={() => setIsOrderConfirmed(false)}
                            >
                                Continue Shopping
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Pharmacy;
