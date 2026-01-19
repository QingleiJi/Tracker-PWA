from PIL import Image, ImageDraw

def create_scandi_icon():
    # Colors
    bg_color = (89, 115, 102)  # #597366 Scandi Accent
    line_color = (255, 255, 255) # White

    # Size
    size = (1024, 1024)
    
    # Create image
    img = Image.new('RGB', size, color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw a minimal "Tracker" curve
    # Points for a smooth curve (Bezier-like or just lines)
    # Let's do a simple ascending line graph style but curved/smooth
    
    # Coordinates
    # Start bottom left, go to top right with a dip in middle
    # Or just a simple stylized "Check" or "Pulse"
    
    # Let's do a clean sine-wave like curve + a dot
    
    width = 100
    points = [
        (150, 700),
        (350, 600),
        (550, 750),
        (850, 350)
    ]
    
    # Draw smooth curve roughly
    # Since PIL doesn't have easy Bezier, we'll draw thick lines with rounded caps
    # effectively creating a "connected" look.
    
    draw.line(points, fill=line_color, width=width, joint='curve')
    
    # Add a dot at the end to signify "current point"
    end_point = points[-1]
    r = 80
    draw.ellipse((end_point[0]-r, end_point[1]-r, end_point[0]+r, end_point[1]+r), fill=line_color)

    # Save
    output_path = 'Tracker/Assets.xcassets/AppIcon.appiconset/1024.png'
    img.save(output_path)
    print(f"Icon saved to {output_path}")

if __name__ == "__main__":
    create_scandi_icon()
