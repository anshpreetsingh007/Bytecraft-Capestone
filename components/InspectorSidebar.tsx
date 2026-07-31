"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  User,
  Home,
  DollarSign,
  ClipboardList,
  FileText,
  LogOut,
  X,
} from "lucide-react";

import { useAuth } from "../Context/AuthContext";
import "./inspector-sidebar.css";


function LadderIcon() {

  return (

    <div className="ladder-icon">

      <span></span>
      <span></span>
      <span></span>

    </div>

  );

}



export default function InspectorSidebar() {


  const [open, setOpen] = useState(false);

  const pathname = usePathname();

  const router = useRouter();

  const { logOut } = useAuth();



  async function handleLogout() {

    await logOut();

    router.push("/signin");

  }



  const links = [

    {
      name: "Dashboard",
      href: "/inspector/dashboard",
      icon: Home,
    },

    {
      name: "Inspections",
      href: "/inspector/inspections",
      icon: FileText,
    },

    {
      name: "Cost Estimate",
      href: "/inspector/cost-estimate",
      icon: DollarSign,
    },

    {
      name: "Reports",
      href: "/inspector/reports",
      icon: ClipboardList,
    },

    {
      name: "Profile",
      href: "/inspector/profile",
      icon: User,
    },

  ];



  return (

    <>


      <button
        className="sidebar-toggle"
        onClick={() => setOpen(!open)}
      >

        {open ? <X size={28}/> : <LadderIcon />}

      </button>



      {open && (

        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />

      )}




      <aside
        className={`inspector-sidebar ${open ? "show" : ""}`}
      >


        <h2>
          MARKIT ROOFING
        </h2>


        <p className="role">
          INSPECTOR
        </p>



        <nav>

          {links.map((link)=>{

            const Icon = link.icon;


            return (

              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={
                  pathname === link.href
                  ? "active"
                  : ""
                }
              >

                <Icon size={20}/>

                <span>
                  {link.name}
                </span>

              </Link>

            );

          })}


        </nav>




        <button
          className="logout"
          onClick={handleLogout}
        >

          <LogOut size={20}/>

          <span>
            Logout
          </span>

        </button>


      </aside>


    </>

  );

}
