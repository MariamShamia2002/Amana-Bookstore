// src/app/cart/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CartItem from "../components/CartItem";
import { Book, CartItem as CartItemType } from "../types";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<
    { book: Book; quantity: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cart items from API
  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }
      const data = await response.json();

      // Fetch book details for each cart item
      const itemsWithBooks = await Promise.all(
        data.cart.map(async (item: CartItemType) => {
          const bookResponse = await fetch(`/api/books?id=${item.bookId}`);
          if (bookResponse.ok) {
            const bookData = await bookResponse.json();
            const book = bookData.books[0];
            return book ? { book, quantity: item.quantity } : null;
          }
          return null;
        }),
      );

      setCartItems(
        itemsWithBooks.filter(
          (item): item is { book: Book; quantity: number } => item !== null,
        ),
      );
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (bookId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId, quantity: newQuantity }),
      });

      if (response.ok) {
        // Update local state
        const updatedItems = cartItems.map((item) =>
          item.book.id === bookId ? { ...item, quantity: newQuantity } : item,
        );
        setCartItems(updatedItems);

        // Notify navbar
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const removeItem = async (bookId: string) => {
    try {
      const response = await fetch(`/api/cart?bookId=${bookId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update local state
        const updatedItems = cartItems.filter(
          (item) => item.book.id !== bookId,
        );
        setCartItems(updatedItems);

        // Notify navbar
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (response.ok) {
        setCartItems([]);
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.book.price * item.quantity,
    0,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl text-gray-600 mb-4">Your cart is empty</h2>
          <Link
            href="/"
            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md">
            {cartItems.map((item) => (
              <CartItem
                key={item.book.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
              />
            ))}
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center text-xl font-bold mb-4 text-gray-800">
              <span>Total: ${totalPrice.toFixed(2)}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="flex-1 bg-gray-500 text-white text-center py-3 rounded-md hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="flex-1 bg-red-500 text-white py-3 rounded-md hover:bg-red-600 transition-colors cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
