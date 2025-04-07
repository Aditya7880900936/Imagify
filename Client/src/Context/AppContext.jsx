import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [credit, setCredit] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const loadCreditsData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/credits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(data);
      if (data.success) {
        setCredit(data.credits);
        setUser(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Auth failed:", error);
      toast.error("Session expired. Please log in again.");
      logout(); // <--- Automatically logs out and clears token
    }
  };

  const generateImage = async (prompt) => {
    if (!user?.id) {
      console.error("generateImage: User ID missing");
      toast.error("User not loaded properly.");
      return;
    }
  
    try {
      console.log("Sending to backend:", { userId: user.id, prompt }); // ✅ Debug log
      const { data } = await axios.post(
        `${backendUrl}/api/image/generate-image`,
        { userId: user.id, prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data.success) {
        loadCreditsData();
        return data.resultImage;
      } else {
        toast.error(data.message);
        loadCreditsData();
        if (data.creditBalance <= 0) {
          toast.error("Insufficient credits. Please purchase more credits.");
          navigate("/buy-credit");
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Error generating image. Please try again.");
    }
  };
  
  

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setShowLogin(false);
  };

  useEffect(() => {
    if (token) {
      loadCreditsData();
    } else {
      logout(); // Clean any garbage
    }
  }, [token]);

  const value = {
    user,
    setUser,
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    credit,
    setCredit,
    loadCreditsData,
    logout,
    generateImage,
  };
  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
