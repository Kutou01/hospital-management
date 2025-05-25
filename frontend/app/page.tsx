import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Facebook, Twitter, Linkedin, Instagram, Phone, Search, Menu } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <div className="bg-[#003087] text-white py-2 px-4 md:px-8 flex justify-between items-center">
        <div className="flex space-x-4">
          <Link href="#" aria-label="Facebook">
            <Facebook size={18} />
          </Link>
          <Link href="#" aria-label="Twitter">
            <Twitter size={18} />
          </Link>
          <Link href="#" aria-label="LinkedIn">
            <Linkedin size={18} />
          </Link>
          <Link href="#" aria-label="Instagram">
            <Instagram size={18} />
          </Link>
        </div>
        <div className="flex items-center">
          <Phone size={18} className="mr-2" />
          <span>+1-123-5663582</span>
        </div>
      </div>

      {/* Navigation */}
      <header className="bg-white py-4 px-4 md:px-8 flex justify-between items-center border-b">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="text-[#003087] font-bold text-4xl mr-2">H</div>
            <div>
              <div className="text-[#003087] font-bold text-xl">Hospital</div>
              <div className="text-gray-700">Management</div>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex space-x-6 ml-10">
          <Link href="/" className="font-medium">
            Home
          </Link>
          <Link href="/about" className="font-medium">
            About
          </Link>
          <Link href="/doctors" className="font-medium">
            Doctors
          </Link>
          <Link href="/services" className="font-medium">
            Services
          </Link>
          <Link href="/blog" className="font-medium">
            Blog
          </Link>
          <Link href="/pages" className="font-medium">
            Pages
          </Link>
          <Link href="/auth/login" className="font-medium">
            Đăng nhập
          </Link>
          <Link href="/auth/register" className="font-medium">
            Đăng ký
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button aria-label="Search">
            <Search size={20} />
          </button>
          <Button variant="default" size="icon" className="md:hidden bg-[#003087]">
            <Menu />
          </Button>
          <Button variant="default" size="icon" className="hidden md:flex bg-[#003087]">
            <Menu />
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative bg-[#e6f7ff] py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#1a3b5d] mb-4">
                  Your Partner In
                  <br />
                  Health and Wellness
                </h1>
                <p className="text-gray-600 mb-8">
                  Lorem ipsum dolor sit amet, consetetur uigredi
                  <br />
                  uloh niu launlch muulsm em edet.
                </p>
                <div className="flex gap-4">
                  <Link href="/auth/login">
                    <Button className="bg-[#003087] hover:bg-[#002266] text-white px-8 py-6 rounded font-bold">
                      ĐĂNG NHẬP
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="outline" className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white px-8 py-6 rounded font-bold">
                      ĐĂNG KÝ
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full bg-[#a8e0f7]">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    alt="Doctor"
                    width={400}
                    height={400}
                    className="rounded-full object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[10%] left-[5%] w-16 h-16 rounded-full bg-[#a8e0f7] opacity-50"></div>
            <div className="absolute top-[30%] left-[15%] w-8 h-8 rounded-full bg-[#a8e0f7] opacity-50"></div>
            <div className="absolute top-[60%] left-[10%] w-12 h-12 rounded-full bg-[#a8e0f7] opacity-50"></div>
            <div className="absolute top-[20%] right-[40%] text-[#a8e0f7] opacity-30 text-5xl">+</div>
            <div className="absolute top-[50%] right-[30%] text-[#a8e0f7] opacity-30 text-5xl">+</div>
          </div>

          {/* Today's Schedule Card */}
          <div className="absolute right-4 md:right-8 lg:right-16 top-1/2 -translate-y-1/2 max-w-[300px] hidden md:block">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-xl font-bold mb-4">Today's Schedule</h3>
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Patient</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2">05:00 AM</td>
                      <td className="py-2">Lauren Clark</td>
                      <td className="py-2">
                        <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Start</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">05:00 AM</td>
                      <td className="py-2">Joanne Morales</td>
                      <td className="py-2">
                        <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Start</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">03:00 AM</td>
                      <td className="py-2">Michael Perry</td>
                      <td className="py-2">
                        <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Start</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2">03:00 AM</td>
                      <td className="py-2">Donald Hawkins</td>
                      <td className="py-2">
                        <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Start</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-12 container mx-auto px-4 md:px-8">
          <h2 className="text-3xl font-bold mb-2">Our Healthcare Service</h2>
          <p className="text-gray-600 mb-8">Lorem ipsum acimereugade ed ero elicmi.</p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#003087] text-white">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 mt-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#003087] text-2xl font-bold">+</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Emergency Department</h3>
              </CardContent>
            </Card>

            <Card className="bg-[#003087] text-white">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 mt-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#003087] text-2xl">👶</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Pediatric Department</h3>
              </CardContent>
            </Card>

            <Card className="bg-[#003087] text-white">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 mt-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#003087] text-xl">🔬</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Diagnostic Imaging</h3>
              </CardContent>
            </Card>

            <Card className="bg-[#003087] text-white">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 mt-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#003087] text-xl">👨‍⚕️</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Orthopedic Department</h3>
              </CardContent>
            </Card>

            <Card className="bg-[#003087] text-white">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 mt-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#003087] text-xl">🧪</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Laboratory</h3>
              </CardContent>
            </Card>

            <Card className="bg-[#003087] text-white">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-4 mt-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#003087] text-xl">👩‍⚕️</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Laboratory</h3>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Appointment Section */}
        <section className="container mx-auto px-4 md:px-8 mb-12">
          <Card className="bg-[#003087] text-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">RECENT APPOINTMENT</h3>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
                  <div className="w-4 h-4 bg-[#003087] rounded-full"></div>
                </div>
                <span className="mr-2">80</span>
                <Progress value={80} className="h-2 flex-1" />
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link href="/about-us" className="text-gray-600 hover:text-gray-900">
                About Us
              </Link>
              <Link href="/services" className="text-gray-600 hover:text-gray-900">
                Services
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                Contact
              </Link>
              <Link href="/privacy-policy" className="text-gray-600 hover:text-gray-900">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                Terms e'serce
              </Link>
            </div>
            <div className="text-gray-600">© 2025 Hospital Management. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
