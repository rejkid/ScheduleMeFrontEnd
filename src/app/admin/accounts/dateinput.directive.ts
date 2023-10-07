import { AfterContentChecked, AfterViewInit, Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

export  enum Segment {
  First,
  Second,
  Third
}
@Directive({
  selector: '[appDateInput]',
})

export class DateInputDirective {
  initialized : boolean = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    console.log("S:" + this.el.nativeElement.selectionStart
      + " E:" + this.el.nativeElement.selectionEnd
    );
    
    // document.onselectionchange = (evt) => {
    //   const target = document.querySelector("input");
    //   console.log("S:" + this.el.nativeElement.selectionStart
    //     + " E:" + this.el.nativeElement.selectionEnd
    //   );
    //   if (this.el.nativeElement?.selectionStart !== this.el.nativeElement?.selectionEnd) {
    //     const pos = this.el.nativeElement?.selectionDirection === "forward" ? this.el.nativeElement.selectionEnd : this.el.nativeElement?.selectionStart;
    //     this.el.nativeElement?.setSelectionRange(pos!, pos!);
    //   }
    // };

    document.addEventListener("selectstart", () => {
      console.log("Selection started");
    });
  }
  
  @HostListener('selectstart', ['$event'])
  onSelectStart(event: KeyboardEvent): void {
    //event.preventDefault();
    console.log("onSelectStart called");
    console.log("S:" + this.el.nativeElement.selectionStart
      + " E:" + this.el.nativeElement.selectionEnd
    );
  }
  @HostListener('select', ['$event'])
  onSelect(event: KeyboardEvent): void {
    //event.preventDefault();
    console.log("onSelect called");
    console.log("S:" + this.el.nativeElement.selectionStart
      + " E:" + this.el.nativeElement.selectionEnd
    );
  }
  @HostListener('selectionchange', ['$event'])
  onSelectionChange(event: KeyboardEvent): void {
    //event.preventDefault();
    console.log("onSelectionChange called");
    console.log("S:" + this.el.nativeElement.selectionStart
      + " E:" + this.el.nativeElement.selectionEnd
    );
  }
  

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if(!this.initialized && event.button === 0) { // Main button pressed, usually the left button
      this.selectSegment(Segment.First);
      this.initialized = false;
      console.log("Select Segment");
      event.preventDefault();
    }
  }
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    
    if(!this.initialized && event.button === 0) { // Main button pressed, usually the left button
      this.selectSegment(Segment.First);
      this.initialized = false;
      console.log("On Click");
    }
  }
  @HostListener('contextmenu', ['$event'])
  onContextMnu(event: MouseEvent): void {
    
    if(!this.initialized && event.button === 0) { // Main button pressed, usually the left button
      this.selectSegment(Segment.First);
      this.initialized = false;
      console.log("On Context");;
    }
  }
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    
    // const s = this.el.nativeElement.selectionStart;

    // this.el.nativeElement.value = this.el.nativeElement.value.slice(0, s) + this.el.nativeElement.value.slice(s + 1);
    // this.el.nativeElement.selectionEnd = s;


    // const s = this.el.nativeElement.selectionStart;
    // this.el.nativeElement.value = this.el.nativeElement.value.slice(0, s) + this.el.nativeElement.value.slice(s + 1);
    // this.el.nativeElement.selectionEnd = s;
    console.log("KeyDown: S:" + this.el.nativeElement.selectionStart
      + " E:" + this.el.nativeElement.selectionEnd
    );
    var number = parseInt(event.key, 10);
    if (event.key !== 'Tab' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && isNaN(number)) {
      event.preventDefault();
      return;

    }

    if (event.key === 'Tab' || event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      // Select segment
      this.selectNextSegment((event.key === 'Tab' && !event.shiftKey) || event.key === 'ArrowRight');
      event.preventDefault();
    } else if (!isNaN(number)) {
      console.log("Digit pressed");
      event.preventDefault();
    }
  }

  private selectNextSegment(forward: boolean): void {
    var start = this.el.nativeElement.selectionStart
    var end = this.el.nativeElement.selectionEnd

    /* Handle the case with no `Shift` key pressed */
    if (forward) {
      this.moveForward(start);
    } else {
      this.moveBackward(start);
    }
  }

  private selectSegment(seg : Segment) {
    var start : number = null;
    var end : number = null;

    switch (seg) {
      case Segment.First:
        start = 0;
        end = this.el.nativeElement.value.indexOf("-", start);
        break;
    
      default:
        break;
    }
    if(start !== null && end !== null) {
      this.el.nativeElement.setSelectionRange(start, end, "forward");
    }
  }

  private moveBackward(start: any) {
    var reversedValue = this.el.nativeElement.value.split("").reduce((acc: any, char: any) => char + acc, "");

    var revStartTemp = reversedValue.indexOf("-", reversedValue.length - start) + 1;
    var revStart = (reversedValue.length - revStartTemp);
    if (revStart != -1) {
      if (reversedValue.indexOf("-", revStartTemp) != -1) {
        var revEnd = (reversedValue.length - reversedValue.indexOf("-", revStartTemp));
        this.el.nativeElement.setSelectionRange(revEnd, revStart);
      } else {
        revEnd = 0;
        this.el.nativeElement.setSelectionRange(revEnd, revStart);
      }
    } else {
      // We are at the beginning
      revEnd = reversedValue.length - reversedValue.indexOf("-", 0);
      this.el.nativeElement.setSelectionRange(revEnd, revStart);
    }
  }

  private moveForward(start: any) {
    var forwardStart: number = this.el.nativeElement.value.indexOf("-", start);
    if (forwardStart != -1) {
      var forwardEnd = this.el.nativeElement.value.indexOf("-", forwardStart + 1);
      if (forwardEnd != -1) {
        // We could find second separator
        //var forwardEnd = this.el.nativeElement.value.indexOf("-", forwardStart + 1)
        this.el.nativeElement.setSelectionRange(forwardStart + 1, forwardEnd);
      } else {
        this.el.nativeElement.setSelectionRange(forwardStart + 1, -1);
      }
    } else {
      // We are at the end
      var forwardEndTemp = this.el.nativeElement.value.indexOf("-", 0);
      this.el.nativeElement.setSelectionRange(0, forwardEndTemp);
    }
  }
  // onInput(value: string): void {

  //   var start = this.el.nativeElement.selectionStart
  //   var end = this.el.nativeElement.selectionEnd

  //   const s = this.el.nativeElement.selectionStart;

  //   this.el.nativeElement.value = this.el.nativeElement.value.slice(0, s) + this.el.nativeElement.value.slice(s + 1);
  //   this.el.nativeElement.selectionEnd = s;

  //   if (start != end) {
  //     // Block selected
  //   } else {

  //   }
  //   if (this.el.nativeElement.value.slice(s, s + 1) == "-") {
  //     this.el.nativeElement.selectionStart = s + 1;
  //   }
  //   console.log("Input S:" + this.el.nativeElement.selectionStart
  //     + " E:" + this.el.nativeElement.selectionEnd
  //   );





  //   // const sanitizedValue = this.sanitizeInput(value);

  //   // // Update the input value with sanitized content
  //   // this.renderer.setProperty(this.el.nativeElement, 'value', sanitizedValue);

  //   // // Set the cursor position based on the content
  //   // this.setCursorPosition(sanitizedValue);
  // }

  // @HostListener('keypress', ['$event.target.value'])
  // onKeystroke(value: string): void {
  //   var start = this.el.nativeElement.selectionStart
  //   var end = this.el.nativeElement.selectionEnd

  //   // const s = this.el.nativeElement.selectionStart;
  //   // this.el.nativeElement.value = this.el.nativeElement.value.slice(0, s) + this.el.nativeElement.value.slice(s + 1);
  //   // this.el.nativeElement.selectionEnd = s;
  //   console.log("KeyPress: S:" + this.el.nativeElement.selectionStart
  //     + " E:" + this.el.nativeElement.selectionEnd
  //   );
  // }
  // @HostListener('mousedown', ['$event.target.value'])
  // onMouseDown(value: string): void {
  //   var start = this.el.nativeElement.selectionStart
  //   var end = this.el.nativeElement.selectionEnd

  //   // const s = this.el.nativeElement.selectionStart;
  //   // this.el.nativeElement.value = this.el.nativeElement.value.slice(0, s) + this.el.nativeElement.value.slice(s + 1);
  //   // this.el.nativeElement.selectionEnd = s;
  //   console.log("Mouse S:" + this.el.nativeElement.selectionStart
  //     + " E:" + this.el.nativeElement.selectionEnd
  //   );
  // }
  // private sanitizeInput(value: string): string {
  //   // Remove non-numeric characters
  //   const numericValue = value.replace(/[^0-9]/g, '');

  //   // Format the date as DD-MM-YYYY
  //   const formattedValue = this.formatDate(numericValue);

  //   return formattedValue;
  // }

  // private formatDate(value: string): string {
  //   if (value.length <= 2) {
  //     return value;
  //   } else if (value.length <= 4) {
  //     return `${value.slice(0, 2)}-${value.slice(2)}`;
  //   } else {
  //     return `${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 8)}`;
  //   }
  // }

  // private setCursorPosition(value: string): void {
  //   const positions = [2, 5]; // Separator positions

  //   for (const position of positions) {
  //     if (value.length > position) {
  //       this.el.nativeElement.setSelectionRange(position + 1, position + 1);

  //     }
  //   }
  // }
}