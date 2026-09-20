import { createContext, useContext, useEffect, useMemo, useState } from "react";
const CartContext = createContext(null);
const CART_STORAGE_KEY = "om-tiffin-website-cart";
const loadStoredCart = () => {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) {
      return [];
    }
    const parsedCart = JSON.parse(storedCart);
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Cart Load Error:", error);
    return [];
  }
};
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadStoredCart);
  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error("Cart Save Error:", error);
    }
  }, [cartItems]);
  const addToCart = (menuItem, mealType) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) =>
          String(item.menuItemId) === String(menuItem._id) &&
          item.mealType === mealType
      );
      if (existingItem) {
        return currentItems.map((item) =>
          String(item.menuItemId) === String(menuItem._id) &&
          item.mealType === mealType
            ? {
                ...item,
                quantity: Number(item.quantity) + 1,
              }
            : item
        );
      }
      return [
        ...currentItems,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: Number(menuItem.price),
          quantity: 1,
          mealType,
        },
      ];
    });
  };
  const updateCartQuantity = (menuItemId, mealType, quantity) => {
    const nextQuantity = Number(quantity);
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      setCartItems((currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              String(item.menuItemId) === String(menuItemId) &&
              item.mealType === mealType
            )
        )
      );
      return;
    }
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        String(item.menuItemId) === String(menuItemId) &&
        item.mealType === mealType
          ? {
              ...item,
              quantity: Math.floor(nextQuantity),
            }
          : item
      )
    );
  };
  const removeFromCart = (menuItemId, mealType) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            String(item.menuItemId) === String(menuItemId) &&
            item.mealType === mealType
          )
      )
    );
  };
  const clearCart = () => {
    setCartItems([]);
  };
  const cartItemCount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );
  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );
  const value = useMemo(
    () => ({
      cartItems,
      setCartItems,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      cartItemCount,
      cartTotal,
    }),
    [
      cartItems,
      cartItemCount,
      cartTotal,
    ]
  );
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
};
export default CartContext;
