import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { RecentOrders } from "@/components/admin/dashboard/RecentOrders";
import { StockStatus } from "@/components/admin/dashboard/StockStatus";
import { RecentReviews } from "@/components/admin/dashboard/RecentReviews";

export default function AdminDashboard() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-6 lg:p-10">
        <div className="mx-auto space-y-8">

          {/* Hero Section - UPDATED */}
          {/* 1. Background is now a soft solid color (rare-primary at 10% opacity) */}
          {/* 2. Text is Dark Gray/Black for perfect readability */}
          <div className="relative overflow-hidden rounded-3xl bg-rare-primary/10 border border-rare-primary/20 p-10 md:p-14">

            <div className="relative z-10">
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 tracking-wide leading-tight text-gray-900">
                Welcome back, <span className="text-rare-primary">Admin</span>
              </h2>
              <p className="font-body text-gray-700 text-lg max-w-2xl leading-relaxed">
                Here&apos;s an overview of your store&apos;s performance today. You have new orders and messages waiting for your review.
              </p>

              <div className="mt-8 flex gap-4">
                {/* Primary Button */}
                <button className="px-6 py-3 bg-rare-primary text-grey rounded-xl font-bold text-sm shadow-lg shadow-rare-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                  View Orders
                </button>
                {/* Secondary Button */}
                <button className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all duration-300">
                  Manage Products
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="font-heading text-2xl font-bold text-gray-900">Overview</h3>
              <span className="text-sm text-gray-600 font-body bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                Last 30 Days
              </span>
            </div>
            <EcommerceMetrics />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Recent Orders */}
            <div className="lg:col-span-2 space-y-8">
              <RevenueChart />
              <RecentOrders />
              <RecentReviews />
            </div>

            {/* Right Column - Stock Status & Extras */}
            <div className="space-y-8">
              <StockStatus />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}